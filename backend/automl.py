"""
AutoML Pipeline Engine — runs all 9 analysis steps and yields step events.

Steps:
  upload → analyze → task → preprocess → recommend → train → evaluate → shap → viz

Each step yields a dict: { step, status, data, elapsed }

Threading: This module's run_pipeline() is a synchronous generator designed to be
run in a background thread via concurrent.futures.ThreadPoolExecutor.
The caller is responsible for consuming events and forwarding them to the WebSocket.
"""
import json
import time
import logging
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Generator

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)

# ── COMMON TARGET COLUMN NAMES ──────────────────────────────────────────────────
TARGET_HINTS = [
    "survived", "target", "label", "class", "y", "price", "sale_price",
    "salesprice", "sales", "revenue", "churn", "default", "fraud", "spam",
    "sentiment", "medv", "outcome", "result", "diagnosis", "species",
    "quality", "income", "mpg", "charges",
]


# ── HELPER FUNCTIONS ───────────────────────────────────────────────────────────

TIME_HINTS = ["date", "time", "timestamp", "year", "month", "day"]

def detect_time_column(df: pd.DataFrame) -> str | None:
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            return col
    cols_lower = {c.lower(): c for c in df.columns}
    for hint in TIME_HINTS:
        for c_low, c in cols_lower.items():
            if hint in c_low:
                return c
    return None

def detect_target_column(df: pd.DataFrame) -> str | None:
    cols_lower = {c.lower(): c for c in df.columns}
    for hint in TARGET_HINTS:
        if hint in cols_lower:
            return cols_lower[hint]
    
    # Check for clustering: if no hints and multiple numeric columns
    if len(df.columns) >= 2:
        last_col = df.columns[-1]
        if pd.api.types.is_float_dtype(df[last_col]):
            return None
            
    return df.columns[-1]


def detect_task_type(df: pd.DataFrame, target_col: str | None, time_col: str | None) -> tuple[str, dict, str]:
    if target_col is None:
        return "Clustering", {}, "No target column hint was identified or provided, and the dataset contains multiple numeric columns for unsupervised group discovery."
        
    if time_col is not None:
        return "Time Series", {}, f"A date/time column ('{time_col}') was detected alongside a target column ('{target_col}'), indicating a temporal forecasting/prediction task."

    target = df[target_col].dropna()
    n_unique = target.nunique()

    if pd.api.types.is_numeric_dtype(target) and n_unique > 15:
        return "Regression", {}, f"The target column ('{target_col}') contains continuous numeric values ({n_unique} unique values), suggesting a value estimation/regression task."

    counts = target.value_counts().to_dict()
    counts = {str(k): int(v) for k, v in counts.items()}

    if n_unique == 2:
        return "Binary Classification", counts, f"The target column ('{target_col}') has exactly 2 unique categories, suggesting a binary decision classification task."
    return "Multi-class Classification", counts, f"The target column ('{target_col}') has a discrete set of {n_unique} unique categories, indicating a multi-category classification task."


def safe_float(v):
    try:
        f = float(v)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 4)
    except Exception:
        return None


class StatsmodelsWrapper:
    def __init__(self, model_class, **kwargs):
        self.model_class = model_class
        self.kwargs = kwargs
        self.model_ = None

    def fit(self, X, y):
        from statsmodels.tsa.arima.model import ARIMA
        if self.model_class == ARIMA:
            self.model_ = self.model_class(y, **self.kwargs).fit()
        else:
            self.model_ = self.model_class(y, **self.kwargs).fit()
        return self

    def predict(self, X):
        return self.model_.forecast(steps=len(X))

    def score(self, X, y):
        from sklearn.metrics import r2_score
        return r2_score(y, self.predict(X))


def predict_model_pack(model_pack, df_raw: pd.DataFrame) -> dict:
    """
    Given a model pack (dictionary of serialized models and preprocessing configs)
    and a raw DataFrame of input rows, perform identical preprocessing and yield predictions.
    """
    df = df_raw.copy()
    
    # 1. Extract properties
    task_type = model_pack.get("task_type")
    target_col = model_pack.get("target_col")
    id_cols = model_pack.get("id_cols", [])
    high_null_cols = model_pack.get("high_null_cols", [])
    cat_cols = model_pack.get("cat_cols", [])
    num_cols = model_pack.get("num_cols", [])
    imputation_strategy = model_pack.get("imputation_strategy", "median")
    scaling_strategy = model_pack.get("scaling_strategy", "none")
    feature_names = model_pack.get("feature_names", [])
    imputer_values = model_pack.get("imputer_values", {})
    cat_modes = model_pack.get("cat_modes", {})
    scaler = model_pack.get("scaler")
    label_mapping = model_pack.get("label_mapping", {})
    label_encoders = model_pack.get("label_encoders", {})
    model = model_pack.get("model")
    is_regression = model_pack.get("is_regression", False)
    is_clustering = model_pack.get("is_clustering", False)
    is_time_series = model_pack.get("is_time_series", False)

    # Remove target column if present
    if target_col and target_col in df.columns:
        df = df.drop(columns=[target_col])

    # 2. Impute numeric columns
    for col in num_cols:
        fill_val = imputer_values.get(col, 0.0)
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(fill_val)
        else:
            df[col] = fill_val

    # 3. Impute categorical columns
    for col in cat_cols:
        fill_val = cat_modes.get(col, "missing")
        if col in df.columns:
            df[col] = df[col].astype(str).fillna(fill_val)
        else:
            df[col] = fill_val

    # 4. Encode high cardinality categoricals
    for col in cat_cols:
        if col in label_encoders:
            col_le = label_encoders[col]
            if col in df.columns:
                classes_set = set(col_le.classes_)
                df[col] = df[col].astype(str).apply(lambda x: x if x in classes_set else col_le.classes_[0])
                df[col] = col_le.transform(df[col])
            else:
                df[col] = 0

    # 5. Align with one-hot columns exactly
    X_pred = pd.DataFrame(index=df.index)
    for col in feature_names:
        if col in num_cols:
            X_pred[col] = df[col].astype(float)
        elif col in label_encoders:
            X_pred[col] = df[col].astype(float)
        else:
            found_orig = False
            for orig_cat in cat_cols:
                if col.startswith(orig_cat + "_"):
                    suffix = col[len(orig_cat) + 1:]
                    if orig_cat in df.columns:
                        X_pred[col] = (df[orig_cat].astype(str) == suffix).astype(float)
                    else:
                        X_pred[col] = 0.0
                    found_orig = True
                    break
            if not found_orig:
                X_pred[col] = 0.0

    # 6. Scale features
    if scaler and scaling_strategy != "none":
        existing_num = [c for c in num_cols if c in X_pred.columns]
        if existing_num:
            X_pred[existing_num] = scaler.transform(X_pred[existing_num])

    # Ensure feature order matches exactly
    X_pred = X_pred[feature_names]

    # 7. Predict
    preds = model.predict(X_pred.values.astype(np.float32))

    probs = None
    if not is_regression and not is_clustering and not is_time_series and hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(X_pred.values.astype(np.float32)).tolist()
        except Exception:
            pass

    mapped_preds = preds.tolist()
    if label_mapping:
        inv_label_mapping = {v: k for k, v in label_mapping.items()}
        mapped_preds = [inv_label_mapping.get(int(p), str(p)) for p in preds]

    return {
        "predictions": mapped_preds,
        "probabilities": probs,
    }



# ── MAIN PIPELINE ──────────────────────────────────────────────────────────────

def run_pipeline(
    file_path: str,
    manual_mode: bool = False,
    input_queue = None,
    session_id: str = "default",
) -> Generator[dict, None, None]:
    """
    Synchronous generator. Yields one event dict per step.
    Designed to run inside a background thread.
    """
    start_time = time.time()

    def elapsed():
        return round(time.time() - start_time, 2)

    def event(step, status, data):
        return {"step": step, "status": status, "data": data, "elapsed": elapsed()}

    # ── STEP 1: UPLOAD ─────────────────────────────────────────────────────────
    yield event("upload", "running", {})
    try:
        path = Path(file_path)
        if path.suffix.lower() == ".json":
            df_raw = pd.read_json(file_path)
        else:
            df_raw = pd.read_csv(file_path)

        df = df_raw.copy()
        preview = json.loads(df.head(10).to_json(orient="records", date_format="iso"))

        yield event("upload", "done", {
            "filename": path.name,
            "rows": len(df),
            "cols": len(df.columns),
            "columns": list(df.columns),
            "preview_rows": preview,
        })
    except Exception as e:
        yield event("upload", "error", {"error": str(e)})
        return

    # Detect target & time columns early for EDA and PCA coloring
    time_col = detect_time_column(df)
    target_col = detect_target_column(df)

    # ── STEP 2: DATA PROFILE (EDA & PCA) ───────────────────────────────────────
    yield event("analyze", "running", {})
    per_column = []
    for col in df.columns:
        nulls = int(df[col].isna().sum())
        null_pct = round(nulls / len(df) * 100, 1)
        dtype = str(df[col].dtype)
        col_info = {"name": col, "dtype": dtype, "nulls": nulls, "null_pct": null_pct}

        # Outlier & distribution computations
        if pd.api.types.is_numeric_dtype(df[col]) and not df[col].isna().all():
            col_info["min"] = safe_float(df[col].min())
            col_info["max"] = safe_float(df[col].max())
            col_info["mean"] = safe_float(df[col].mean())
            col_info["std"] = safe_float(df[col].std())

            # Outlier detection (IQR method)
            try:
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col].count()
                col_info["outliers_count"] = int(outliers)
                col_info["outliers_pct"] = round(float(outliers / len(df) * 100), 1)
            except Exception:
                pass

            # Histogram bins for EDA visualization
            try:
                clean_series = df[col].dropna()
                counts, bin_edges = np.histogram(clean_series, bins=10)
                col_info["histogram"] = {
                    "counts": counts.tolist(),
                    "bins": [round(float(b), 4) for b in bin_edges.tolist()],
                }
            except Exception:
                pass
        else:
            top = df[col].value_counts().head(5).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top.items()}

        per_column.append(col_info)

    # PCA Projection for high-dimensional EDA mapping
    pca_data = {}
    try:
        num_cols = df.select_dtypes(include=np.number).columns.tolist()
        if target_col in num_cols:
            num_cols.remove(target_col)

        if len(num_cols) >= 2:
            from sklearn.decomposition import PCA
            from sklearn.preprocessing import StandardScaler

            # Impute temporarily for PCA calculation
            X_pca = df[num_cols].copy()
            for c in num_cols:
                if X_pca[c].isna().any():
                    X_pca[c] = X_pca[c].fillna(X_pca[c].median() if not X_pca[c].isna().all() else 0)

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_pca)

            pca = PCA(n_components=min(3, len(num_cols)))
            X_proj = pca.fit_transform(X_scaled)

            var_ratio = pca.explained_variance_ratio_.tolist()

            # Downsample for premium visual performance (max 300 points)
            max_points = 300
            if len(df) > max_points:
                indices = np.random.choice(len(df), max_points, replace=False)
            else:
                indices = np.arange(len(df))

            points = []
            for idx in indices:
                pt = {
                    "x": round(float(X_proj[idx, 0]), 4),
                    "y": round(float(X_proj[idx, 1]), 4),
                }
                if X_proj.shape[1] > 2:
                    pt["z"] = round(float(X_proj[idx, 2]), 4)
                if target_col is not None:
                    pt["label"] = str(df.iloc[idx][target_col])
                points.append(pt)

            pca_data = {
                "explained_variance": [round(float(v), 4) for v in var_ratio],
                "points": points,
                "components_count": len(var_ratio),
            }
    except Exception as pca_e:
        logger.warning(f"PCA calculation failed: {pca_e}")

    duplicate_rows = int(df.duplicated().sum())
    yield event("analyze", "done", {
        "per_column": per_column,
        "duplicate_rows": duplicate_rows,
        "pca_data": pca_data,
    })

    # ── STEP 3: TASK DETECTION ─────────────────────────────────────────────────
    yield event("task", "running", {})
    task_type, class_counts, reason = detect_task_type(df, target_col, time_col)

    if manual_mode and input_queue is not None:
        yield event("task", "paused", {
            "target_col": target_col,
            "time_col": time_col,
            "task_type": task_type,
            "class_counts": class_counts,
            "reason": reason,
            "columns": list(df.columns),
            "is_imbalanced": (
                False if task_type in ("Regression", "Time Series", "Clustering") else
                max(class_counts.values()) / sum(class_counts.values()) > 0.75
                if class_counts else False
            )
        })
        user_choices = input_queue.get()
        if isinstance(user_choices, dict):
            target_col = user_choices.get("target_col", target_col)
            task_type = user_choices.get("task_type", task_type)
            time_col = user_choices.get("time_col", time_col)
            
            # Recalculate target info
            task_type, class_counts, reason = detect_task_type(df, target_col, time_col)
            
            # Allow user to manually drop columns
            manual_dropped_cols = user_choices.get("dropped_cols", [])
            if manual_dropped_cols:
                valid_drops = [c for c in manual_dropped_cols if c in df.columns and c != target_col]
                if valid_drops:
                    df = df.drop(columns=valid_drops)

    is_regression = task_type in ("Regression", "Time Series")
    is_clustering = task_type == "Clustering"
    is_time_series = task_type == "Time Series"

    yield event("task", "done", {
        "target_col": target_col,
        "time_col": time_col,
        "task_type": task_type,
        "class_counts": class_counts,
        "reason": reason,
        "is_imbalanced": (
            False if (is_regression or is_clustering) else
            max(class_counts.values()) / sum(class_counts.values()) > 0.75
            if class_counts else False
        ),
    })

    # ── STEP 4: PREPROCESSING ──────────────────────────────────────────────────
    yield event("preprocess", "running", {})
    transforms = []
    shape_before = df.shape

    # Drop the target column temporarily for feature processing
    X = df.drop(columns=[target_col]) if target_col in df.columns else df.copy()
    y = df[target_col].copy() if target_col in df.columns else None

    # --- AUTOMATIC ID DROPPING ---
    id_cols = []
    for col in X.columns:
        col_lower = col.lower()
        is_id_name = col_lower in {
            "id", "uuid", "uid", "index", "rowid", "row_id", "serial", 
            "serial_no", "serial_number", "passengerid", "passenger_id"
        }
        is_id_pattern = (col_lower.endswith("id") or col_lower.endswith("_id") or col_lower.startswith("id_"))
        
        n_unique = X[col].nunique()
        total_rows = len(X)
        
        is_sequential = False
        if pd.api.types.is_integer_dtype(X[col]) and n_unique == total_rows:
            diffs = X[col].sort_values().diff().dropna()
            if len(diffs) > 0 and (diffs == 1).all():
                is_sequential = True
                
        if is_id_name or (is_id_pattern and n_unique > min(15, total_rows * 0.5)) or is_sequential:
            id_cols.append(col)

    for col in id_cols:
        transforms.append({
            "action": "Dropped (ID Column)",
            "column": col,
            "detail": f"Identified as redundant identifier/index column and removed to prevent overfitting.",
        })
    if id_cols:
        X = X.drop(columns=id_cols)

    # Default settings
    imputation_strategy = "median"
    scaling_strategy = "standard"

    if manual_mode and input_queue is not None:
        yield event("preprocess", "paused", {
            "imputation_strategies": ["median", "mean", "mode"],
            "scaling_strategies": ["standard", "minmax", "none"],
            "detected_id_cols": id_cols,
        })
        user_choices = input_queue.get()
        if isinstance(user_choices, dict):
            imputation_strategy = user_choices.get("imputation_strategy", imputation_strategy)
            scaling_strategy = user_choices.get("scaling_strategy", scaling_strategy)

    # Drop very high null columns (>75%)
    high_null_cols = [c for c in X.columns if X[c].isna().mean() > 0.75]
    for col in high_null_cols:
        transforms.append({
            "action": "Dropped (Sparsity)",
            "column": col,
            "detail": f"{round(X[col].isna().mean()*100, 1)}% missing — column removed",
        })
    X = X.drop(columns=high_null_cols)

    # Identify numeric and categorical columns
    num_cols = X.select_dtypes(include=np.number).columns.tolist()
    cat_cols = X.select_dtypes(exclude=np.number).columns.tolist()

    # Impute numeric
    for col in num_cols:
        if X[col].isna().any():
            if imputation_strategy == "median":
                fill_val = round(float(X[col].median()), 3)
            elif imputation_strategy == "mean":
                fill_val = round(float(X[col].mean()), 3)
            else: # mode
                fill_val = round(float(X[col].mode().iloc[0] if not X[col].mode().empty else 0), 3)
            X[col] = X[col].fillna(fill_val)
            transforms.append({
                "action": f"Imputed ({imputation_strategy.capitalize()})",
                "column": col,
                "detail": f"Filled {int(df[col].isna().sum())} nulls with {imputation_strategy}={fill_val}",
            })

    # Impute categorical
    for col in cat_cols:
        if X[col].isna().any():
            mode_val = str(X[col].mode().iloc[0] if not X[col].mode().empty else "missing")
            X[col] = X[col].fillna(mode_val)
            transforms.append({
                "action": "Imputed (Mode)",
                "column": col,
                "detail": f"Filled {int(df[col].isna().sum())} nulls with mode='{mode_val}'",
            })

    # Encode target for classification
    from sklearn.preprocessing import LabelEncoder
    label_encoders = {}
    target_encoder = None
    if not is_regression and y is not None:
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y.astype(str))
        label_mapping = {str(cls): int(i) for i, cls in enumerate(target_encoder.classes_)}
    else:
        if y is not None:
            # Handle possible nulls in continuous target
            y = pd.to_numeric(y, errors="coerce")
            if y.isna().any():
                y = y.fillna(y.median() if not y.isna().all() else 0)
        label_mapping = {}

    # One-hot encode categorical features
    for col in cat_cols:
        n_unique = X[col].nunique()
        if n_unique <= 10:
            dummies = pd.get_dummies(X[col], prefix=col, drop_first=True, dtype=float)
            X = pd.concat([X.drop(columns=[col]), dummies], axis=1)
            transforms.append({
                "action": "One-Hot Encoded",
                "column": col,
                "detail": f"{n_unique} unique values → {len(dummies.columns)} binary features",
            })
        else:
            col_le = LabelEncoder()
            X[col] = col_le.fit_transform(X[col].astype(str))
            label_encoders[col] = col_le
            transforms.append({
                "action": "Label Encoded",
                "column": col,
                "detail": f"{n_unique} unique values — high cardinality, label encoded",
            })

    # Pre-calculate imputer and category modes values for all features to serialize
    imputer_values = {}
    for col in num_cols:
        try:
            if imputation_strategy == "median":
                val = float(df_raw[col].median())
            elif imputation_strategy == "mean":
                val = float(df_raw[col].mean())
            else:
                val = float(df_raw[col].mode().iloc[0] if not df_raw[col].mode().empty else 0.0)
        except Exception:
            val = 0.0
        imputer_values[col] = round(val, 3)

    cat_modes = {}
    for col in cat_cols:
        try:
            val = str(df_raw[col].mode().iloc[0] if not df_raw[col].mode().empty else "missing")
        except Exception:
            val = "missing"
        cat_modes[col] = val

    # Scale numeric
    if num_cols and scaling_strategy != "none":
        if scaling_strategy == "standard":
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            detail_str = f"Scaled {len(num_cols)} numeric features to zero mean, unit variance"
        else: # minmax
            from sklearn.preprocessing import MinMaxScaler
            scaler = MinMaxScaler()
            detail_str = f"Scaled {len(num_cols)} numeric features to [0, 1] range"
            
        existing_num = [c for c in num_cols if c in X.columns]
        if existing_num:
            X[existing_num] = scaler.fit_transform(X[existing_num])
            transforms.append({
                "action": f"{scaling_strategy.capitalize()} Scaled",
                "column": ", ".join(existing_num),
                "detail": detail_str,
            })

    feature_names = list(X.columns)
    shape_after = X.shape

    yield event("preprocess", "done", {
        "transforms": transforms,
        "shape_before": {"rows": shape_before[0], "cols": shape_before[1]},
        "shape_after": {"rows": shape_after[0], "cols": shape_after[1]},
        "feature_names": feature_names,
        "label_mapping": label_mapping,
    })

    # ── STEP 5: MODEL SELECTION ────────────────────────────────────────────────
    yield event("recommend", "running", {})

    from sklearn.linear_model import LogisticRegression, LinearRegression, ElasticNet
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
    from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
    from sklearn.neural_network import MLPClassifier, MLPRegressor
    from sklearn.naive_bayes import GaussianNB
    from sklearn.svm import SVC, SVR
    from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
    import xgboost as xgb

    if is_clustering:
        candidate_models = [
            {
                "id": "kmeans",
                "name": "K-Means Clustering",
                "reason": "Fast, distance-based centroid clustering; best for spherical clusters",
                "params": {"n_clusters": 3, "init": "k-means++"},
                "model": KMeans(n_clusters=3, random_state=42),
            },
            {
                "id": "dbscan",
                "name": "DBSCAN",
                "reason": "Density-based spatial clustering; finds arbitrarily shaped clusters and handles outliers",
                "params": {"eps": 0.5, "min_samples": 5},
                "model": DBSCAN(eps=0.5, min_samples=5),
            },
            {
                "id": "agglomerative",
                "name": "Hierarchical Clustering",
                "reason": "Builds nested clusters iteratively; good for smaller datasets with hierarchical structure",
                "params": {"n_clusters": 3, "linkage": "ward"},
                "model": AgglomerativeClustering(n_clusters=3),
            },
        ]
    elif is_time_series:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        from statsmodels.tsa.arima.model import ARIMA
        
        candidate_models = [
            {
                "id": "ets",
                "name": "Exponential Smoothing",
                "reason": "Captures trend and seasonality patterns natively",
                "params": {"trend": "add", "seasonal": None},
                "model": StatsmodelsWrapper(ExponentialSmoothing, trend="add"),
            },
            {
                "id": "arima",
                "name": "ARIMA",
                "reason": "Auto-regressive integrated moving average for stationary temporal patterns",
                "params": {"order": (1, 1, 1)},
                "model": StatsmodelsWrapper(ARIMA, order=(1, 1, 1)),
            },
            {
                "id": "xgb_ts",
                "name": "XGBoost Time Series",
                "reason": "Gradient boosting adapted for sequence prediction",
                "params": {"n_estimators": 100, "max_depth": 5},
                "model": xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42),
            },
        ]
    elif is_regression:
        candidate_models = [
            {
                "id": "xgboost",
                "name": "XGBoost Regressor",
                "reason": "Gradient boosting excels at structured tabular regression with non-linear patterns",
                "params": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.1},
                "model": xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, verbosity=0),
            },
            {
                "id": "rf",
                "name": "Random Forest Regressor",
                "reason": "Ensemble of decision trees reduces variance via bootstrap aggregation",
                "params": {"n_estimators": 100, "max_features": "sqrt"},
                "model": RandomForestRegressor(n_estimators=100, random_state=42),
            },
            {
                "id": "gbr",
                "name": "Gradient Boosting Regressor",
                "reason": "Builds an additive model in a forward stage-wise fashion",
                "params": {"n_estimators": 100, "learning_rate": 0.1},
                "model": GradientBoostingRegressor(n_estimators=100, random_state=42),
            },
            {
                "id": "knn",
                "name": "K-Nearest Neighbors",
                "reason": "Non-parametric method that relies on local feature similarity",
                "params": {"n_neighbors": 5},
                "model": KNeighborsRegressor(n_neighbors=5),
            },
            {
                "id": "elasticnet",
                "name": "ElasticNet Regression",
                "reason": "Linear regression with combined L1 and L2 priors as regularizer",
                "params": {"alpha": 1.0, "l1_ratio": 0.5},
                "model": ElasticNet(random_state=42),
            },
            {
                "id": "mlp",
                "name": "Neural Network (MLP)",
                "reason": "Multi-layer perceptron capable of learning complex non-linear functions",
                "params": {"hidden_layer_sizes": (100,), "activation": "relu"},
                "model": MLPRegressor(hidden_layer_sizes=(100,), max_iter=500, random_state=42),
            },
        ]
    else:
        n_classes = len(np.unique(y))
        candidate_models = [
            {
                "id": "xgboost",
                "name": "XGBoost Classifier",
                "reason": "Captures non-linear feature interactions; state-of-the-art for tabular data",
                "params": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.1},
                "model": xgb.XGBClassifier(
                    n_estimators=100, max_depth=5, learning_rate=0.1,
                    use_label_encoder=False, eval_metric="logloss",
                    random_state=42, verbosity=0,
                    num_class=n_classes if n_classes > 2 else None,
                ),
            },
            {
                "id": "rf",
                "name": "Random Forest Classifier",
                "reason": "Bootstrap aggregation reduces variance; robust to outliers",
                "params": {"n_estimators": 100, "max_features": "sqrt"},
                "model": RandomForestClassifier(n_estimators=100, random_state=42),
            },
            {
                "id": "gbc",
                "name": "Gradient Boosting Classifier",
                "reason": "Produces competitive, highly robust classification models",
                "params": {"n_estimators": 100, "learning_rate": 0.1},
                "model": GradientBoostingClassifier(n_estimators=100, random_state=42),
            },
            {
                "id": "knn",
                "name": "K-Nearest Neighbors",
                "reason": "Classification based on the majority vote of the k nearest neighbors",
                "params": {"n_neighbors": 5},
                "model": KNeighborsClassifier(n_neighbors=5),
            },
            {
                "id": "logreg",
                "name": "Logistic Regression",
                "reason": "Fast, interpretable baseline — ideal for linearly separable classes",
                "params": {"C": 1.0, "penalty": "l2", "solver": "lbfgs"},
                "model": LogisticRegression(C=1.0, max_iter=500, random_state=42),
            },
            {
                "id": "nb",
                "name": "Naive Bayes",
                "reason": "Probabilistic classifier based on applying Bayes' theorem",
                "params": {},
                "model": GaussianNB(),
            },
            {
                "id": "mlp",
                "name": "Neural Network (MLP)",
                "reason": "Learns non-linear models using backpropagation",
                "params": {"hidden_layer_sizes": (100,), "activation": "relu"},
                "model": MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42),
            },
        ]
    if manual_mode and input_queue is not None:
        yield event("recommend", "paused", {
            "models": [{"id": m["id"], "name": m["name"], "reason": m["reason"], "params": m["params"]}
                       for m in candidate_models],
        })
        user_choices = input_queue.get()
        if isinstance(user_choices, dict):
            enabled_ids = user_choices.get("enabled_model_ids")
            if enabled_ids is not None:
                candidate_models = [m for m in candidate_models if m["id"] in enabled_ids]
            
            # Allow tweaking params
            custom_params = user_choices.get("model_params")
            if custom_params and isinstance(custom_params, dict):
                for m in candidate_models:
                    mid = m["id"]
                    if mid in custom_params and isinstance(custom_params[mid], dict):
                        for pk, pv in custom_params[mid].items():
                            try:
                                if isinstance(pv, str):
                                    if pv.isdigit():
                                        pv = int(pv)
                                    else:
                                        try:
                                            pv = float(pv)
                                        except ValueError:
                                            pass
                            except Exception:
                                pass
                            m["params"][pk] = pv
                        
                        try:
                            if hasattr(m["model"], "set_params"):
                                m["model"].set_params(**m["params"])
                            elif hasattr(m["model"], "kwargs"):  # StatsmodelsWrapper
                                m["model"].kwargs.update(m["params"])
                        except Exception as pe:
                            logger.warning(f"Failed to set custom params for {mid}: {pe}")

    yield event("recommend", "done", {
        "models": [{"id": m["id"], "name": m["name"], "reason": m["reason"], "params": m["params"]}
                   for m in candidate_models],
    })

    # ── STEP 6: MODEL TRAINING (streamed per fold) ─────────────────────────────
    yield event("train", "running", {})

    from sklearn.model_selection import StratifiedKFold, KFold, TimeSeriesSplit
    from sklearn.metrics import silhouette_score

    X_arr = X.values.astype(np.float32)
    y_arr = np.array(y) if not is_clustering else None

    # Dynamically cap KNN n_neighbors to prevent errors on small datasets
    n_samples = len(X_arr)
    for m_info in candidate_models:
        if m_info["id"] in ("knn",):
            max_neighbors = max(1, n_samples - 1)
            current_k = m_info.get("params", {}).get("n_neighbors", 5)
            if current_k > max_neighbors:
                safe_k = max(1, max_neighbors)
                m_info["params"]["n_neighbors"] = safe_k
                if hasattr(m_info["model"], "set_params"):
                    m_info["model"].set_params(n_neighbors=safe_k)
                logger.info(f"Reduced KNN n_neighbors from {current_k} to {safe_k} for dataset with {n_samples} samples")

    # Limit folds for small datasets
    n_splits = min(5, max(2, len(X_arr) // 30))
    if is_time_series:
        cv = TimeSeriesSplit(n_splits=n_splits)
    elif is_regression:
        cv = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    elif not is_clustering:
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    else:
        cv = None

    scoring = "r2" if is_regression else "accuracy"
    if is_time_series: scoring = "r2"
    if is_clustering: scoring = "silhouette"
    
    cv_results = {}  # model_id -> list of fold scores

    for m_info in candidate_models:
        model = m_info["model"]
        fold_scores = []
        
        try:
            if is_clustering:
                yield event("train", "log", {
                    "model_id": m_info["id"],
                    "model_name": m_info["name"],
                    "log": f"[{m_info['name']}] Fitting on full dataset...",
                })
                model.fit(X_arr)
                labels = model.labels_ if hasattr(model, "labels_") else model.predict(X_arr)
                score = silhouette_score(X_arr, labels) if len(np.unique(labels)) > 1 else 0
                score = round(float(score), 4)
                fold_scores.append(score)
                mean_score = score
                metric_label = "Silhouette Score"
                
                yield event("train", "log", {
                    "model_id": m_info["id"],
                    "model_name": m_info["name"],
                    "log": f"[{m_info['name']}] ✓ Complete. {metric_label}: {score:.4f}",
                })
            else:
                yield event("train", "log", {
                    "model_id": m_info["id"],
                    "model_name": m_info["name"],
                    "log": f"[{m_info['name']}] Starting {n_splits}-Fold Cross-Validation...",
                })

                for fold_idx, (train_idx, val_idx) in enumerate(cv.split(X_arr, y_arr if not is_regression and not is_time_series else None)):
                    X_train, X_val = X_arr[train_idx], X_arr[val_idx]
                    y_train, y_val = y_arr[train_idx], y_arr[val_idx]

                    model.fit(X_train, y_train)

                    if is_regression or is_time_series:
                        try:
                            score = model.score(X_val, y_val)  # R²
                        except Exception:
                            from sklearn.metrics import r2_score
                            preds = model.predict(X_val)
                            score = r2_score(y_val, preds)
                    else:
                        score = (model.predict(X_val) == y_val).mean()

                    score = round(float(score), 4)
                    fold_scores.append(score)

                    metric_label = "R²" if (is_regression or is_time_series) else "Accuracy"
                    yield event("train", "log", {
                        "model_id": m_info["id"],
                        "model_name": m_info["name"],
                        "log": f"[{m_info['name']}] Fold {fold_idx+1}/{n_splits} → CV {metric_label}: {score:.4f}",
                    })

                mean_score = round(float(np.mean(fold_scores)), 4)
                
                yield event("train", "log", {
                    "model_id": m_info["id"],
                    "model_name": m_info["name"],
                    "log": f"[{m_info['name']}] ✓ Complete. Mean CV {metric_label}: {mean_score:.4f}",
                })

            cv_results[m_info["id"]] = {"folds": fold_scores, "mean": mean_score}

        except Exception as model_train_err:
            logger.warning(f"Model {m_info['name']} failed during training: {model_train_err}")
            yield event("train", "log", {
                "model_id": m_info["id"],
                "model_name": m_info["name"],
                "log": f"[{m_info['name']}] ⚠ Skipped — {str(model_train_err)[:120]}",
            })
            # Assign a score of -inf so this model is never selected as best
            cv_results[m_info["id"]] = {"folds": [], "mean": float("-inf")}

    # Remove models that completely failed (mean=-inf) from candidate_models for evaluation
    candidate_models = [m for m in candidate_models if cv_results.get(m["id"], {}).get("mean", float("-inf")) > float("-inf")]
    if not candidate_models:
        yield event("train", "error", {"error": "All models failed during cross-validation. Check your dataset."})
        return

    # Build summary log lines for persistence (mirrors what was streamed live)
    summary_logs = {}
    for m_info in candidate_models:
        mid = m_info["id"]
        res = cv_results.get(mid, {})
        folds = res.get("folds", [])
        mean_s = res.get("mean", 0)
        
        if is_clustering:
            metric_label = "Silhouette Score"
            lines = [f"[{m_info['name']}] Fitting on full dataset...",
                     f"[{m_info['name']}] ✓ Complete. {metric_label}: {mean_s:.4f}"]
        else:
            metric_label = "R²" if (is_regression or is_time_series) else "Accuracy"
            lines = [f"[{m_info['name']}] Ran {n_splits}-Fold Cross-Validation..."]
            for i, score in enumerate(folds):
                lines.append(f"[{m_info['name']}] Fold {i+1}/{n_splits} → CV {metric_label}: {score:.4f}")
            lines.append(f"[{m_info['name']}] ✓ Complete. Mean CV {metric_label}: {mean_s:.4f}")
        
        summary_logs[mid] = lines

    yield event("train", "done", {"cv_results": cv_results, "logs": summary_logs})


    # ── STEP 7: EVALUATION ─────────────────────────────────────────────────────
    yield event("evaluate", "running", {})

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix, mean_absolute_error, r2_score, mean_squared_error,
        mean_absolute_percentage_error, silhouette_score, davies_bouldin_score
    )

    if is_clustering:
        X_train_f, X_test_f = X_arr, X_arr
        y_train_f, y_test_f = None, None
    elif is_time_series:
        X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
            X_arr, y_arr, test_size=0.2, shuffle=False
        )
    else:
        n_total = len(X_arr)
        n_classes = len(np.unique(y_arr)) if not is_regression else 1
        # For very small datasets: need at least n_classes samples in test set
        # Use test_size=max(n_classes, 1) if the computed 0.2 split gives too few
        computed_test_n = max(1, int(n_total * 0.2))
        if computed_test_n < n_classes or n_total <= n_classes * 2:
            # Dataset too small for a proper split — use full data for eval
            X_train_f, X_test_f = X_arr, X_arr
            y_train_f, y_test_f = y_arr, y_arr
        else:
            try:
                X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
                    X_arr, y_arr, test_size=0.2, random_state=42,
                    stratify=y_arr if not is_regression else None
                )
            except ValueError:
                # Fallback: no stratification
                X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
                    X_arr, y_arr, test_size=max(1, computed_test_n), random_state=42
                )

    # Select best model by CV score
    best_id = max(cv_results, key=lambda k: cv_results[k]["mean"])
    best_model_info = next(m for m in candidate_models if m["id"] == best_id)

    metrics = []
    for m_info in candidate_models:
        m = m_info["model"]
        
        if is_clustering:
            m.fit(X_train_f)
            labels = m.labels_ if hasattr(m, "labels_") else m.predict(X_train_f)
            has_clusters = len(np.unique(labels)) > 1
            row = {
                "model": m_info["name"],
                "model_id": m_info["id"],
                "silhouette": safe_float(silhouette_score(X_train_f, labels)) if has_clusters else 0,
                "davies_bouldin": safe_float(davies_bouldin_score(X_train_f, labels)) if has_clusters else 0,
                "is_best": m_info["id"] == best_id,
            }
        else:
            m.fit(X_train_f, y_train_f)
            y_pred = m.predict(X_test_f)

            if is_time_series or is_regression:
                try:
                    mape = mean_absolute_percentage_error(y_test_f, y_pred)
                except Exception:
                    mape = None
                
                row = {
                    "model": m_info["name"],
                    "model_id": m_info["id"],
                    "r2": safe_float(r2_score(y_test_f, y_pred)),
                    "mae": safe_float(mean_absolute_error(y_test_f, y_pred)),
                    "rmse": safe_float(np.sqrt(mean_squared_error(y_test_f, y_pred))),
                    "mape": safe_float(mape) if is_time_series else None,
                    "is_best": m_info["id"] == best_id,
                }
            else:
                avg = "binary" if len(np.unique(y_arr)) == 2 else "weighted"
                try:
                    if hasattr(m, "predict_proba"):
                        y_prob = m.predict_proba(X_test_f)
                        auc = safe_float(roc_auc_score(
                            y_test_f, y_prob if avg == "weighted" else y_prob[:, 1],
                            multi_class="ovr" if avg == "weighted" else "raise",
                        ))
                    else:
                        auc = None
                except Exception:
                    auc = None

                row = {
                    "model": m_info["name"],
                    "model_id": m_info["id"],
                    "accuracy": safe_float(accuracy_score(y_test_f, y_pred)),
                    "precision": safe_float(precision_score(y_test_f, y_pred, average=avg, zero_division=0)),
                    "recall": safe_float(recall_score(y_test_f, y_pred, average=avg, zero_division=0)),
                    "f1": safe_float(f1_score(y_test_f, y_pred, average=avg, zero_division=0)),
                    "auc": auc,
                    "is_best": m_info["id"] == best_id,
                }
        metrics.append(row)

    # Confusion matrix and ROC for best model (classification only)
    conf_matrix = []
    roc_fpr, roc_tpr = [], []
    if not (is_regression or is_time_series or is_clustering):
        best_fitted = best_model_info["model"]
        cm = confusion_matrix(y_test_f, best_fitted.predict(X_test_f))
        conf_matrix = [{"row": r} for r in cm.tolist()]

        if len(np.unique(y_arr)) == 2 and hasattr(best_fitted, "predict_proba"):
            try:
                from sklearn.metrics import roc_curve
                fpr, tpr, _ = roc_curve(y_test_f, best_fitted.predict_proba(X_test_f)[:, 1])
                roc_fpr = [round(float(v), 4) for v in fpr.tolist()]
                roc_tpr = [round(float(v), 4) for v in tpr.tolist()]
            except Exception:
                pass

    # --- FULL FIT & SERIALIZATION ---
    try:
        import pickle
        best_model_full = best_model_info["model"]
        X_arr_full = X.values.astype(np.float32)
        
        if is_clustering:
            best_model_full.fit(X_arr_full)
        else:
            y_arr_full = np.array(y)
            best_model_full.fit(X_arr_full, y_arr_full)
            
        model_pack = {
            "session_id": session_id,
            "task_type": task_type,
            "target_col": target_col,
            "id_cols": id_cols,
            "high_null_cols": high_null_cols,
            "cat_cols": cat_cols,
            "num_cols": num_cols,
            "imputation_strategy": imputation_strategy,
            "scaling_strategy": scaling_strategy,
            "feature_names": feature_names,
            "imputer_values": imputer_values,
            "cat_modes": cat_modes,
            "scaler": scaler if (scaling_strategy != "none" and 'scaler' in locals()) else None,
            "label_mapping": label_mapping,
            "target_encoder": target_encoder,
            "label_encoders": label_encoders,
            "model": best_model_full,
            "is_regression": is_regression,
            "is_clustering": is_clustering,
            "is_time_series": is_time_series,
        }
        
        models_dir = Path(__file__).parent / "workspace" / "models"
        models_dir.mkdir(parents=True, exist_ok=True)
        model_filepath = models_dir / f"{session_id}.pkl"
        with open(model_filepath, "wb") as f:
            pickle.dump(model_pack, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info(f"Saved complete model pack for session {session_id} to {model_filepath}")
    except Exception as save_err:
        logger.error(f"Failed to fit and serialize best model pack: {save_err}")

    yield event("evaluate", "done", {
        "metrics": metrics,
        "best_model": best_model_info["name"],
        "best_model_id": best_id,
        "confusion_matrix": conf_matrix,
        "roc_fpr": roc_fpr,
        "roc_tpr": roc_tpr,
        "task_type": task_type,
    })

    # ── STEP 8: SHAP ───────────────────────────────────────────────────────────
    yield event("shap", "running", {})

    shap_features = []
    if not is_clustering:
        try:
            import shap as shap_lib
            best_model = best_model_info["model"]

            # Use a sample for speed on large datasets
            sample_size = min(200, len(X_train_f))
            X_sample = X_train_f[:sample_size]

            shap_values = None
            if best_id in ("xgboost", "rf", "gbc", "gbr"):
                try:
                    explainer = shap_lib.TreeExplainer(best_model)
                    shap_values = explainer.shap_values(X_sample)
                except Exception as tree_e:
                    logger.warning(f"TreeExplainer failed: {tree_e}")

            if shap_values is None:
                # For any model, try KernelExplainer with a small background
                try:
                    bg = shap_lib.sample(X_sample, min(50, len(X_sample)))
                    predict_fn = (
                        best_model.predict_proba
                        if hasattr(best_model, "predict_proba") and not is_regression
                        else best_model.predict
                    )
                    explainer = shap_lib.KernelExplainer(predict_fn, bg)
                    shap_values = explainer.shap_values(X_sample[:50], nsamples=50)
                except Exception as ke:
                    logger.warning(f"KernelExplainer failed: {ke}")

            if shap_values is not None:
                # Handle multi-class SHAP (list of arrays)
                if isinstance(shap_values, list):
                    shap_arr = np.abs(np.array(shap_values)).mean(axis=0)
                else:
                    shap_arr = np.abs(shap_values)

                if shap_arr.ndim > 2:
                    shap_arr = shap_arr.mean(axis=0)
                mean_shap = shap_arr.mean(axis=0) if shap_arr.ndim == 2 else shap_arr

                feature_importance = [
                    {"name": feature_names[i], "importance": safe_float(float(mean_shap[i]))}
                    for i in range(min(len(feature_names), len(mean_shap)))
                ]
                feature_importance.sort(key=lambda x: x["importance"] or 0, reverse=True)
                shap_features = feature_importance[:15]  # top 15 features

        except Exception as e:
            logger.warning(f"SHAP computation failed entirely: {e}")

        # Fallback 1: feature_importances_ (tree-based models)
        if not shap_features:
            best_model = best_model_info["model"]
            if hasattr(best_model, "feature_importances_"):
                fi = best_model.feature_importances_
                shap_features = sorted(
                    [{"name": feature_names[i], "importance": safe_float(float(fi[i]))} for i in range(min(len(feature_names), len(fi)))],
                    key=lambda x: x["importance"] or 0,
                    reverse=True
                )[:15]

        # Fallback 2: coef_ (linear models)
        if not shap_features:
            best_model = best_model_info["model"]
            if hasattr(best_model, "coef_"):
                coef = np.abs(np.array(best_model.coef_))
                if coef.ndim > 1:
                    coef = coef.mean(axis=0)  # multi-class: average across classes
                shap_features = sorted(
                    [{"name": feature_names[i], "importance": safe_float(float(coef[i]))} for i in range(min(len(feature_names), len(coef)))],
                    key=lambda x: x["importance"] or 0,
                    reverse=True
                )[:15]

        # Fallback 3: if still nothing, provide features with 0 importance
        if not shap_features:
            shap_features = [{"name": n, "importance": 0.0} for n in feature_names[:15]]

    yield event("shap", "done", {
        "features": shap_features,
        "best_model": best_model_info["name"],
    })

    # ── STEP 9: VISUALIZATIONS ─────────────────────────────────────────────────
    yield event("viz", "running", {})

    # Correlation matrix on original numeric columns (from raw df)
    corr_matrix = []
    corr_labels = []
    try:
        raw_num = df_raw.select_dtypes(include=np.number).dropna(axis=1, how="all")
        if len(raw_num.columns) > 1:
            corr = raw_num.corr().round(3)
            corr_labels = list(corr.columns)
            corr_matrix = corr.values.tolist()
    except Exception as e:
        logger.warning(f"Correlation matrix failed: {e}")

    # Feature histograms for top 5 numeric features
    histograms = {}
    try:
        if shap_features:
            top_num_cols = [f["name"] for f in shap_features if f["name"] in df_raw.columns
                            and pd.api.types.is_numeric_dtype(df_raw[f["name"]])][:5]
        else:
            top_num_cols = [c for c in df_raw.columns if pd.api.types.is_numeric_dtype(df_raw[c])][:5]
            
        for col in top_num_cols:
            vals = df_raw[col].dropna()
            counts, bin_edges = np.histogram(vals, bins=20)
            histograms[col] = {
                "counts": counts.tolist(),
                "bins": [round(float(e), 3) for e in bin_edges.tolist()],
            }
    except Exception as e:
        logger.warning(f"Histogram computation failed: {e}")

    yield event("viz", "done", {
        "correlation_matrix": corr_matrix,
        "correlation_labels": corr_labels,
        "feature_histograms": histograms,
        "roc_ready": len(roc_fpr) > 0,
    })
