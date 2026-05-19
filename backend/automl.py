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

def detect_target_column(df: pd.DataFrame) -> str:
    cols_lower = {c.lower(): c for c in df.columns}
    for hint in TARGET_HINTS:
        if hint in cols_lower:
            return cols_lower[hint]
    return df.columns[-1]


def detect_task_type(df: pd.DataFrame, target_col: str) -> tuple[str, dict]:
    target = df[target_col].dropna()
    n_unique = target.nunique()

    if pd.api.types.is_numeric_dtype(target) and n_unique > 15:
        return "Regression", {}

    counts = target.value_counts().to_dict()
    counts = {str(k): int(v) for k, v in counts.items()}

    if n_unique == 2:
        return "Binary Classification", counts
    return "Multi-class Classification", counts


def safe_float(v):
    try:
        f = float(v)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 4)
    except Exception:
        return None


# ── MAIN PIPELINE ──────────────────────────────────────────────────────────────

def run_pipeline(file_path: str) -> Generator[dict, None, None]:
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

    # ── STEP 2: DATA PROFILE ───────────────────────────────────────────────────
    yield event("analyze", "running", {})
    per_column = []
    for col in df.columns:
        nulls = int(df[col].isna().sum())
        null_pct = round(nulls / len(df) * 100, 1)
        dtype = str(df[col].dtype)
        col_info = {"name": col, "dtype": dtype, "nulls": nulls, "null_pct": null_pct}

        if pd.api.types.is_numeric_dtype(df[col]) and not df[col].isna().all():
            col_info["min"] = safe_float(df[col].min())
            col_info["max"] = safe_float(df[col].max())
            col_info["mean"] = safe_float(df[col].mean())
            col_info["std"] = safe_float(df[col].std())
        else:
            top = df[col].value_counts().head(5).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top.items()}

        per_column.append(col_info)

    duplicate_rows = int(df.duplicated().sum())
    yield event("analyze", "done", {"per_column": per_column, "duplicate_rows": duplicate_rows})

    # ── STEP 3: TASK DETECTION ─────────────────────────────────────────────────
    yield event("task", "running", {})
    target_col = detect_target_column(df)
    task_type, class_counts = detect_task_type(df, target_col)
    is_regression = task_type == "Regression"

    yield event("task", "done", {
        "target_col": target_col,
        "task_type": task_type,
        "class_counts": class_counts,
        "is_imbalanced": (
            False if is_regression else
            max(class_counts.values()) / sum(class_counts.values()) > 0.75
            if class_counts else False
        ),
    })

    # ── STEP 4: PREPROCESSING ──────────────────────────────────────────────────
    yield event("preprocess", "running", {})
    transforms = []
    shape_before = df.shape

    # Drop the target column temporarily for feature processing
    X = df.drop(columns=[target_col])
    y = df[target_col].copy()

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
            median_val = round(float(X[col].median()), 3)
            X[col] = X[col].fillna(median_val)
            transforms.append({
                "action": "Imputed (Median)",
                "column": col,
                "detail": f"Filled {int(df[col].isna().sum())} nulls with median={median_val}",
            })

    # Impute categorical
    for col in cat_cols:
        if X[col].isna().any():
            mode_val = str(X[col].mode().iloc[0])
            X[col] = X[col].fillna(mode_val)
            transforms.append({
                "action": "Imputed (Mode)",
                "column": col,
                "detail": f"Filled {int(df[col].isna().sum())} nulls with mode='{mode_val}'",
            })

    # Encode target for classification
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    if not is_regression:
        y = le.fit_transform(y.astype(str))
        label_mapping = {str(cls): int(i) for i, cls in enumerate(le.classes_)}
    else:
        y = pd.to_numeric(y, errors="coerce").fillna(y.median())
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
            X[col] = le.fit_transform(X[col].astype(str))
            transforms.append({
                "action": "Label Encoded",
                "column": col,
                "detail": f"{n_unique} unique values — high cardinality, label encoded",
            })

    # Standard scale numeric
    from sklearn.preprocessing import StandardScaler
    if num_cols:
        scaler = StandardScaler()
        existing_num = [c for c in num_cols if c in X.columns]
        if existing_num:
            X[existing_num] = scaler.fit_transform(X[existing_num])
            transforms.append({
                "action": "Standard Scaled",
                "column": ", ".join(existing_num),
                "detail": f"Scaled {len(existing_num)} numeric features to zero mean, unit variance",
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

    from sklearn.linear_model import LogisticRegression, LinearRegression
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.svm import SVC, SVR
    import xgboost as xgb

    if is_regression:
        candidate_models = [
            {
                "id": "xgboost",
                "name": "XGBoost Regressor",
                "reason": "Gradient boosting excels at structured tabular regression with non-linear patterns",
                "params": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.1},
                "model": xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1,
                                           random_state=42, verbosity=0),
            },
            {
                "id": "rf",
                "name": "Random Forest Regressor",
                "reason": "Ensemble of decision trees reduces variance via bootstrap aggregation",
                "params": {"n_estimators": 100, "max_features": "sqrt"},
                "model": RandomForestRegressor(n_estimators=100, random_state=42),
            },
            {
                "id": "linear",
                "name": "Linear Regression",
                "reason": "Interpretable baseline — good when features have linear relationships",
                "params": {"fit_intercept": True},
                "model": LinearRegression(),
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
                "id": "logreg",
                "name": "Logistic Regression",
                "reason": "Fast, interpretable baseline — ideal for linearly separable classes",
                "params": {"C": 1.0, "penalty": "l2", "solver": "lbfgs"},
                "model": LogisticRegression(C=1.0, max_iter=500, random_state=42),
            },
            {
                "id": "svm",
                "name": "SVM Classifier",
                "reason": "Effective in high-dimensional spaces via kernel trick",
                "params": {"kernel": "rbf", "C": 1.0},
                "model": SVC(kernel="rbf", C=1.0, probability=True, random_state=42),
            },
        ]

    yield event("recommend", "done", {
        "models": [{"id": m["id"], "name": m["name"], "reason": m["reason"], "params": m["params"]}
                   for m in candidate_models],
    })

    # ── STEP 6: MODEL TRAINING (streamed per fold) ─────────────────────────────
    yield event("train", "running", {})

    from sklearn.model_selection import StratifiedKFold, KFold, cross_val_score

    X_arr = X.values.astype(np.float32)
    y_arr = np.array(y)

    # Limit folds for small datasets
    n_splits = min(5, max(2, len(y_arr) // 30))
    cv = KFold(n_splits=n_splits, shuffle=True, random_state=42) if is_regression else \
         StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    scoring = "r2" if is_regression else "accuracy"
    cv_results = {}  # model_id -> list of fold scores

    for m_info in candidate_models:
        model = m_info["model"]
        fold_scores = []

        # Manual fold iteration so we can yield per-fold logs
        yield event("train", "log", {
            "model_id": m_info["id"],
            "model_name": m_info["name"],
            "log": f"[{m_info['name']}] Starting {n_splits}-Fold Cross-Validation...",
        })

        for fold_idx, (train_idx, val_idx) in enumerate(cv.split(X_arr, y_arr if not is_regression else None)):
            X_train, X_val = X_arr[train_idx], X_arr[val_idx]
            y_train, y_val = y_arr[train_idx], y_arr[val_idx]

            model.fit(X_train, y_train)

            if is_regression:
                score = model.score(X_val, y_val)  # R²
            else:
                score = (model.predict(X_val) == y_val).mean()

            score = round(float(score), 4)
            fold_scores.append(score)

            metric_label = "R²" if is_regression else "Accuracy"
            yield event("train", "log", {
                "model_id": m_info["id"],
                "model_name": m_info["name"],
                "log": f"[{m_info['name']}] Fold {fold_idx+1}/{n_splits} → CV {metric_label}: {score:.4f}",
            })

        mean_score = round(float(np.mean(fold_scores)), 4)
        cv_results[m_info["id"]] = {"folds": fold_scores, "mean": mean_score}

        yield event("train", "log", {
            "model_id": m_info["id"],
            "model_name": m_info["name"],
            "log": f"[{m_info['name']}] ✓ Complete. Mean CV {metric_label}: {mean_score:.4f}",
        })

    yield event("train", "done", {"cv_results": cv_results})

    # ── STEP 7: EVALUATION ─────────────────────────────────────────────────────
    yield event("evaluate", "running", {})

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix, mean_absolute_error, r2_score, mean_squared_error
    )

    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
        X_arr, y_arr, test_size=0.2, random_state=42,
        stratify=y_arr if not is_regression else None
    )

    # Select best model by CV score
    best_id = max(cv_results, key=lambda k: cv_results[k]["mean"])
    best_model_info = next(m for m in candidate_models if m["id"] == best_id)

    metrics = []
    for m_info in candidate_models:
        m = m_info["model"]
        m.fit(X_train_f, y_train_f)
        y_pred = m.predict(X_test_f)

        if is_regression:
            row = {
                "model": m_info["name"],
                "model_id": m_info["id"],
                "r2": safe_float(r2_score(y_test_f, y_pred)),
                "mae": safe_float(mean_absolute_error(y_test_f, y_pred)),
                "rmse": safe_float(np.sqrt(mean_squared_error(y_test_f, y_pred))),
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
    if not is_regression:
        best_fitted = best_model_info["model"]
        cm = confusion_matrix(y_test_f, best_fitted.predict(X_test_f))
        conf_matrix = cm.tolist()

        if len(np.unique(y_arr)) == 2 and hasattr(best_fitted, "predict_proba"):
            try:
                from sklearn.metrics import roc_curve
                fpr, tpr, _ = roc_curve(y_test_f, best_fitted.predict_proba(X_test_f)[:, 1])
                roc_fpr = [round(float(v), 4) for v in fpr.tolist()]
                roc_tpr = [round(float(v), 4) for v in tpr.tolist()]
            except Exception:
                pass

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
    try:
        import shap as shap_lib
        best_model = best_model_info["model"]

        # Use a sample for speed on large datasets
        sample_size = min(200, len(X_train_f))
        X_sample = X_train_f[:sample_size]

        if best_id in ("xgboost", "rf"):
            explainer = shap_lib.TreeExplainer(best_model)
            shap_values = explainer.shap_values(X_sample)
        else:
            explainer = shap_lib.KernelExplainer(
                best_model.predict_proba if hasattr(best_model, "predict_proba") else best_model.predict,
                shap_lib.sample(X_sample, 50)
            )
            shap_values = explainer.shap_values(X_sample, nsamples=100)

        # Handle multi-class SHAP (list of arrays)
        if isinstance(shap_values, list):
            shap_arr = np.abs(np.array(shap_values)).mean(axis=0)
        else:
            shap_arr = np.abs(shap_values)

        mean_shap = shap_arr.mean(axis=0) if shap_arr.ndim == 2 else shap_arr

        feature_importance = [
            {"name": feature_names[i], "importance": safe_float(mean_shap[i])}
            for i in range(len(feature_names))
        ]
        feature_importance.sort(key=lambda x: x["importance"] or 0, reverse=True)
        shap_features = feature_importance[:15]  # top 15 features

    except Exception as e:
        logger.warning(f"SHAP computation failed: {e}. Using model feature importances as fallback.")
        # Fallback: use feature_importances_ if available
        best_model = best_model_info["model"]
        if hasattr(best_model, "feature_importances_"):
            fi = best_model.feature_importances_
            shap_features = sorted(
                [{"name": feature_names[i], "importance": safe_float(float(fi[i]))} for i in range(len(fi))],
                key=lambda x: x["importance"] or 0,
                reverse=True
            )[:15]
        else:
            shap_features = [{"name": n, "importance": None} for n in feature_names[:10]]

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
        top_num_cols = [f["name"] for f in shap_features if f["name"] in df_raw.columns
                        and pd.api.types.is_numeric_dtype(df_raw[f["name"]])][:5]
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
