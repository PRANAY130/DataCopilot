import os
import glob
import shutil
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# ── DESIGN SYSTEM COLORS ───────────────────────────────────────────────────────
PRIMARY_COLOR = colors.HexColor("#0F172A")    # Deep Slate Navy
SECONDARY_COLOR = colors.HexColor("#475569")  # Slate Gray
ACCENT_COLOR = colors.HexColor("#0D9488")     # Muted Teal
BG_LIGHT = colors.HexColor("#F8FAFC")         # Off-white / Cool Light Gray
TEXT_DARK = colors.HexColor("#1E293B")        # Charcoal
TEXT_MUTED = colors.HexColor("#64748B")       # Muted Slate
BORDER_COLOR = colors.HexColor("#E2E8F0")     # Light border gray

# ── TWO-PASS CANVAS FOR PERFECT PAGE COUNTING & HEADER/FOOTER ──────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()
        print(f"PDF compilation complete. Total pages: {num_pages}")

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # 1. Top Decorative Bar
        self.setFillColor(PRIMARY_COLOR)
        self.rect(0, 786, 612, 6, fill=True, stroke=False)
        
        # 2. Header (pages 2 to 5)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(PRIMARY_COLOR)
            self.drawString(54, 752, "DATACOPILOT: AUTOMATED MACHINE LEARNING & CHAT COPILOT")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(TEXT_MUTED)
            self.drawRightString(558, 752, "ABB TECHNICAL CHALLENGE SUBMISSION")
            
            # Header line
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(54, 745, 558, 745)
            
        # 3. Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(54, 52, 558, 52)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(54, 40, "CONFIDENTIAL — TECHNICAL ARCHITECTURE SUBMISSION")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_str)
        
        self.restoreState()

# Custom flowable or page callback to track where things break
def page_callback(canvas, doc):
    print(f"Page callback: completed page {doc.page}")

def build_pdf():
    pdf_filename = "../DataCopilot_Submission.pdf"
    
    # 8.5 x 11 inches: Width = 612, Height = 792. Margins = 54 (0.75 in).
    # Setting top and bottom margin slightly smaller (60 pt) to prevent overflow
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY_COLOR,
        alignment=1, # Center
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=SECONDARY_COLOR,
        alignment=1, # Center
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=PRIMARY_COLOR,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=ACCENT_COLOR,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        spaceAfter=4
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        bulletIndent=4,
        spaceAfter=3
    )
    
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8,
        textColor=PRIMARY_COLOR,
        backColor=BG_LIGHT,
        borderWidth=0.5,
        borderColor=BORDER_COLOR,
        borderPadding=4,
        spaceAfter=4
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    
    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_DARK
    )

    story = []

    # ── FIND AND COPY DASHBOARD MOCKUP IMAGE ──────────────────────────────────────
    brain_dir = Path("C:/Users/prana/.gemini/antigravity/brain/823e6659-693b-491a-a05e-d5d9b11fad00")
    dashboard_files = glob.glob(str(brain_dir / "datacopilot_dashboard_*.png"))
    local_image_path = "datacopilot_dashboard.png"
    
    if dashboard_files:
        latest_file = max(dashboard_files, key=os.path.getctime)
        shutil.copy(latest_file, local_image_path)
        print(f"Copied dashboard image from {latest_file} to {local_image_path}")
    else:
        print("Warning: Mockup image not found in brain directory.")

    # =========================================================================
    # PAGE 1: INPUTS CONSIDERED
    # =========================================================================
    story.append(Spacer(1, 5))
    story.append(Paragraph("DATACOPILOT", title_style))
    story.append(Paragraph("AI-Driven AutoML & Conversational Insights Engine", subtitle_style))
    
    # Accent metadata block table
    meta_data = [
        [Paragraph("<b>Submitted For:</b> ABB Technical Challenge", body_style),
         Paragraph("<b>Date:</b> May 20, 2026", body_style)],
        [Paragraph("<b>Evaluation Focus:</b> Innovation, Technical Implementation, Industrial Relevance, Scalability & Robustness", body_style),
         Paragraph("<b>Scope:</b> End-to-End AutoML Lifecycle", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[260, 244])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "DataCopilot is a production-ready Automated Machine Learning (AutoML) platform that automates "
        "the entire data science pipeline—from raw data ingestion to interactive, explainable model deployment. "
        "Unlike black-box AutoML tools, DataCopilot combines high-fidelity statistical evaluations with "
        "state-of-the-art SHAP (SHapley Additive exPlanations) values and an LLM-driven Chat Copilot, "
        "enabling domain experts to train, evaluate, visualize, and query complex machine learning models "
        "using natural language. The architecture is split into a robust FastAPI backend running parallel "
        "async task workers and a high-performance Next.js frontend with dark-mode analytics dashboards.",
        body_style
    ))
    
    story.append(Paragraph("2. Inputs Considered", h1_style))
    story.append(Paragraph(
        "The DataCopilot system is engineered to handle multiple categories of inputs. These represent the "
        "starting parameters required to run the automated pipeline and initialize the intelligence modules.",
        body_style
    ))
    
    story.append(Paragraph("2.1 Data and Schema Inputs", h2_style))
    story.append(Paragraph("• <b>File Formats:</b> Structured tabular datasets in standard comma-separated (<code>.csv</code>) or JavaScript Object Notation (<code>.json</code>) files.", bullet_style))
    story.append(Paragraph("• <b>Schema Dimensions:</b> Arbitrary row count ($N$) and feature column count ($D$). Features can consist of mixed types (integers, floats, objects, booleans, timestamps).", bullet_style))
    story.append(Paragraph("• <b>Target Variable Inference:</b> The target column can be specified by the user or automatically inferred by mapping headers against semantic target hints (e.g., <i>survived, target, label, class, price, churn</i>).", bullet_style))
    story.append(Paragraph("• <b>Temporal Columns:</b> Date/time features, identified automatically by scanning columns for datetime data types or headers matching temporal keywords (e.g., <i>date, time, timestamp, year</i>).", bullet_style))
    
    story.append(Paragraph("2.2 System & Operational Inputs", h2_style))
    story.append(Paragraph("• <b>Secure Key Store:</b> Firebase Admin Service Account credentials (<code>serviceAccountKey.json</code>) used to authenticate database operations with the Firestore DB.", bullet_style))
    story.append(Paragraph("• <b>Language Model APIs:</b> Client-side connection parameters and API keys for Google Gemini Pro (via <code>google-genai</code>) and Groq (Llama-3 models) to generate natural language explanations and handle user chat queries.", bullet_style))
    story.append(Paragraph("• <b>Workspace Directories:</b> A dedicated local workspace path (<code>./workspace/uploads</code>) on the backend server acts as a secure, sandboxed cache directory for active dataset sessions.", bullet_style))
    story.append(Paragraph("• <b>HTTP Header Configs:</b> Allowed CORS origins loaded from environment variables (<code>.env</code>) to restrict or permit connections from authorized frontend hosts.", bullet_style))
    
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: PROCESS TO BE FOLLOWED — PART 1: DATA INTAKE & PROFILE
    # =========================================================================
    story.append(Paragraph("3. Core AutoML Process to be Followed", h1_style))
    story.append(Paragraph(
        "DataCopilot executes an orchestrated 9-step pipeline to transform raw, noisy datasets into fully "
        "evaluated models backed by explainable artificial intelligence. The flowchart of operations spans "
        "data ingestion, statistical analysis, preprocessing, training, evaluation, and explanation.",
        body_style
    ))
    
    # Ingestion diagram table
    flow_data = [
        [Paragraph("<b>Step 1: Upload</b>", table_header_style), 
         Paragraph("<b>Step 2: Profile</b>", table_header_style), 
         Paragraph("<b>Step 3: Task Detect</b>", table_header_style)],
        [Paragraph("FastAPI endpoints validate and store raw uploads in a local secure sandbox. Establishes a Firestore session state.", table_body_style),
         Paragraph("Computes null ratios, data types, duplicate rows, numeric stats, and categorical frequencies.", table_body_style),
         Paragraph("Auto-detects target, temporal indices, class distributions, and evaluates class imbalance ratios.", table_body_style)]
    ]
    flow_table = Table(flow_data, colWidths=[168, 168, 168])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Phase 1: Ingestion & Upload Management", h2_style))
    story.append(Paragraph(
        "When a client triggers file upload, the FastAPI server accepts the multipart file stream "
        "and restricts payloads based on file extensions. A unique UUID session ID is generated, "
        "representing the stateful record. The raw file is saved to the workspace, and a new session "
        "document is registered in Firestore. This step handles server-side storage and initiates "
        "the WebSocket connection for streaming pipeline progress.",
        body_style
    ))
    
    story.append(Paragraph("Phase 2: Comprehensive Profiling & Diagnostics", h2_style))
    story.append(Paragraph(
        "Once written, the ingestion worker loads the file into memory using Pandas. It loops through all "
        "columns to generate a rich data profile dictionary. For every column, it calculates: (1) Missing "
        "value counts and percentage ratios, (2) native pandas data types, (3) summary statistics (mean, "
        "min, max, std) for numerical variables, and (4) value distributions (top 5 frequencies) for categorical "
        "variables. It also identifies duplicate records. This profile is serialized and returned to the client "
        "to drive visual dataset summaries.",
        body_style
    ))
    
    story.append(Paragraph("Phase 3: Task Classification & Imbalance Engineering", h2_style))
    story.append(Paragraph(
        "A critical phase is automated machine learning task classification, which occurs without user intervention:",
        body_style
    ))
    story.append(Paragraph("1. <b>Target Search:</b> The system scans column names against a predefined list of common target keywords (e.g. <i>target, label, class, y, churn</i>). If no matches are found, the last column is selected as the target.", bullet_style))
    story.append(Paragraph("2. <b>Temporal Scanning:</b> The system scans column names for date/time keywords. If a temporal column is detected, it registers the dataset as time-series oriented.", bullet_style))
    story.append(Paragraph("3. <b>Task Assignment:</b> If the target column is missing, the system assigns a <b>Clustering</b> task. If a temporal column is present, it assigns a <b>Time Series</b> task. For other cases, it checks the target data type: if it is numeric and contains more than 15 unique values, it assigns <b>Regression</b>; otherwise, it counts the classes—assigning <b>Binary Classification</b> for exactly 2 classes, and <b>Multi-class Classification</b> for more.", bullet_style))
    story.append(Paragraph("4. <b>Imbalance Diagnostic:</b> For classification tasks, it computes class frequency ratios. If the majority class represents over 75% of the samples, the <code>is_imbalanced</code> flag is set to true, triggering warnings in the user dashboard.", bullet_style))
    
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: PROCESS TO BE FOLLOWED — PART 2: PREPROCESS & MODEL SELECTION
    # =========================================================================
    story.append(Paragraph("3. Core AutoML Process to be Followed (Continued)", h1_style))
    story.append(Paragraph(
        "Following task identification, the pipeline processes the data to make it compatible with machine "
        "learning algorithms and selects optimal candidate models for competitive cross-validation.",
        body_style
    ))
    
    # Preprocessing diagram table
    preprocess_data = [
        [Paragraph("<b>Step 4: Preprocessing</b>", table_header_style), 
         Paragraph("<b>Step 5: Recommend</b>", table_header_style), 
         Paragraph("<b>Step 6: Train (CV)</b>", table_header_style)],
        [Paragraph("Drops high-null columns (>75%). Imputes numericals (median) and categoricals (mode). Encodes categories and standardizes numericals.", table_body_style),
         Paragraph("Initializes a list of candidate algorithms with parameters custom-tailored to the detected task.", table_body_style),
         Paragraph("Runs K-Fold, Stratified K-Fold, or Time Series Split. Streams training logs fold-by-fold via WebSockets.", table_body_style)]
    ]
    preprocess_table = Table(preprocess_data, colWidths=[168, 168, 168])
    preprocess_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(preprocess_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Phase 4: Automated Feature Preprocessing & Transformation", h2_style))
    story.append(Paragraph(
        "Data preprocessing is applied sequentially to separate features (X) and target (y):",
        body_style
    ))
    story.append(Paragraph("• <b>High-Sparsity Pruning:</b> Features with more than 75% missing values are dropped automatically.", bullet_style))
    story.append(Paragraph("• <b>Imputation:</b> Missing values in numeric columns are filled with their respective column's median. Missing values in categorical columns are filled with their column's mode. The exact details (value, count) are recorded.", bullet_style))
    story.append(Paragraph("• <b>Categorical Encoding:</b> High-cardinality categorical columns (>10 unique values) are Label Encoded. Low-cardinality categorical columns (<=10 unique values) are One-Hot Encoded into binary dummy columns, balancing feature dimensions.", bullet_style))
    story.append(Paragraph("• <b>Feature Standardization:</b> Numeric columns are standardized to zero mean and unit variance using Scikit-Learn's <code>StandardScaler</code>.", bullet_style))
    story.append(Paragraph("• <b>Target Variable Transformation:</b> For classification tasks, the target column is encoded via <code>LabelEncoder</code>. For regression, it is converted to numeric and missing entries are imputed with the median.", bullet_style))
    
    story.append(Paragraph("Phase 5: Candidate Model Recommendations", h2_style))
    story.append(Paragraph(
        "Rather than training a single model, DataCopilot recommends a list of models from Scikit-Learn and XGBoost, "
        "providing a clear technical justification for each. The model search space is customized based on the task type:",
        body_style
    ))
    
    # Table of models
    model_rows = [
        [Paragraph("<b>Task Type</b>", table_header_style), Paragraph("<b>Candidate Algorithms Included</b>", table_header_style)],
        [Paragraph("Classification", table_body_style), Paragraph("XGBoost Classifier, Random Forest, Gradient Boosting, Logistic Regression, Naive Bayes, Neural Network (MLP), K-Nearest Neighbors (KNN)", table_body_style)],
        [Paragraph("Regression", table_body_style), Paragraph("XGBoost Regressor, Random Forest Regressor, Gradient Boosting Regressor, KNN, ElasticNet, MLP Neural Network", table_body_style)],
        [Paragraph("Clustering", table_body_style), Paragraph("K-Means (distance-based centroids), DBSCAN (density-based), Hierarchical Clustering (agglomerative linkages)", table_body_style)],
        [Paragraph("Time Series", table_body_style), Paragraph("Exponential Smoothing (Holt-Winters), ARIMA (auto-regressive), XGBoost Time Series (regression on temporal offsets)", table_body_style)]
    ]
    model_table = Table(model_rows, colWidths=[100, 404])
    model_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Phase 6: Multi-Fold Cross-Validation Framework", h2_style))
    story.append(Paragraph(
        "To prevent overfitting, the models are trained using cross-validation. "
        "The number of splits is dynamically adjusted: $K = \\min(5, \\max(2, N / 30))$, ensuring that "
        "very small datasets do not fail during validation splits. For classification, the system uses "
        "<code>StratifiedKFold</code> to preserve target class proportions. For regression, standard "
        "<code>KFold</code> is used. For time-series, a temporal <code>TimeSeriesSplit</code> is used, "
        "preventing data leakage from future time steps. Progress and intermediate scores (Accuracy, "
        "R², or Silhouette) are pushed to the WebSocket client fold-by-fold as they are computed.",
        body_style
    ))
    
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: PROCESS TO BE FOLLOWED — PART 3: EVALUATION, SHAP, & COPILOT
    # =========================================================================
    story.append(Paragraph("3. Core AutoML Process to be Followed (Continued)", h1_style))
    story.append(Paragraph(
        "The final phases of the pipeline compute diagnostic evaluation metrics, explain the "
        "underlying model behavior using SHAP values, and initialize the conversational LLM interface.",
        body_style
    ))
    
    # Process diagram 3
    post_data = [
        [Paragraph("<b>Step 7: Evaluate</b>", table_header_style), 
         Paragraph("<b>Step 8: SHAP (Explain)</b>", table_header_style), 
         Paragraph("<b>Step 9: Visual & Chat</b>", table_header_style)],
        [Paragraph("Evaluates all models on a holdout test set (80/20 split). Compares metrics and selects the best performer.", table_body_style),
         Paragraph("Calculates SHAP values to explain global feature importances. Falls back to tree/linear importances.", table_body_style),
         Paragraph("Generates heatmaps, histograms. Runs the LangChain LLM agent for interactive, natural language querying.", table_body_style)]
    ]
    post_table = Table(post_data, colWidths=[168, 168, 168])
    post_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(post_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Phase 7: Rigid Model Evaluation & Holdout Testing", h2_style))
    story.append(Paragraph(
        "A separate 20% holdout test dataset is set aside to evaluate model generalization. "
        "The backend trains each candidate model on the training fold, predicts on the test set, and calculates "
        "a wide range of metrics: Classification models compute Accuracy, Precision, Recall, F1-Score, and "
        "ROC-AUC; Regression models calculate R², MAE, RMSE, and MAPE; Clustering models calculate Silhouette "
        "Scores and the Davies-Bouldin Index. For classification, the system also computes a complete "
        "Confusion Matrix and ROC curve coordinates for the best-performing model (based on CV score).",
        body_style
    ))
    
    story.append(Paragraph("Phase 8: SHAP Interpretability & Feature Attribution", h2_style))
    story.append(Paragraph(
        "To provide model transparency, DataCopilot computes SHAP (SHapley Additive exPlanations) values "
        "for the best-performing model, identifying how much each feature contributes to predictions. "
        "Because SHAP calculations can be computationally intensive, a multi-tier fallback architecture is used:",
        body_style
    ))
    story.append(Paragraph("1. <b>TreeExplainer:</b> Used for tree-based ensemble models (XGBoost, Random Forest, Gradient Boosting) to compute exact SHAP values quickly.", bullet_style))
    story.append(Paragraph("2. <b>KernelExplainer:</b> If the best model is non-tree-based (e.g., MLP, KNN, Logistic Regression), the system samples a small background dataset (up to 50 rows) to estimate SHAP values.", bullet_style))
    story.append(Paragraph("3. <b>Feature Importances:</b> If SHAP fails entirely, the system extracts the model's native <code>feature_importances_</code>.", bullet_style))
    story.append(Paragraph("4. <b>Coefficients:</b> For linear models, the system averages absolute model weights (<code>coef_</code>) to rank features.", bullet_style))
    story.append(Paragraph("The resulting top 15 features are sorted and stored to render feature attribution charts.", bullet_style))
    
    story.append(Paragraph("Phase 9: Conversational AI & Persistence Setup", h2_style))
    story.append(Paragraph(
        "When the pipeline finishes, the backend compiles the data profile, model scores, and SHAP features "
        "into a structured payload. This is passed to a background thread to generate an initial AI analysis "
        "using Google Gemini or Groq. The prompt instructs the LLM to explain the model choice, "
        "explain which features drive performance, point out any data anomalies, and offer business recommendations. "
        "This response is saved in Firestore as the session's <code>ai_insight</code> and sent to the client. "
        "Users can then ask follow-up questions in the chat interface, which is powered by LangChain "
        "and retrieves past messages from Firestore to maintain conversation context.",
        body_style
    ))
    
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: EXPECTED OUTPUT
    # =========================================================================
    story.append(Paragraph("4. Expected Outputs", h1_style))
    story.append(Paragraph(
        "The DataCopilot system generates two primary types of outputs: a structured database "
        "state containing detailed machine learning metadata, and an interactive frontend dashboard UI.",
        body_style
    ))
    
    story.append(Paragraph("4.1 Structured Firestore Session Schema", h2_style))
    story.append(Paragraph(
        "The ultimate output of the pipeline is a rich JSON document persisted in Firestore under a unique "
        "<code>session_id</code>. This structured record enables full reproducibility and is defined as follows:",
        body_style
    ))
    
    code_content = """{
  "uid": "firebase_user_uid", "session_id": "823e6659-693b-491a-a05e-d5d9b11fad00",
  "filename": "customer_churn.csv", "status": "done", "created_at": "2026-05-20T02:12:14Z",
  "ai_insight": "The best model is XGBoost (94.2% Acc)... Key drivers: MonthlyCharges, Tenure...",
  "steps": {
    "upload": { "status": "done", "data": { "rows": 7043, "cols": 21 } },
    "analyze": { "status": "done", "data": { "per_column": [...], "duplicate_rows": 0 } },
    "task": { "status": "done", "data": { "target_col": "Churn", "task_type": "Binary Classification" } },
    "preprocess": { "status": "done", "data": { "transforms": [...], "feature_names": [...] } },
    "recommend": { "status": "done", "data": { "models": [...] } },
    "train": { "status": "done", "data": { "cv_results": { "xgboost": { "mean": 0.942, ... } } } },
    "evaluate": { "status": "done", "data": { "metrics": [...], "confusion_matrix": [...] } },
    "shap": { "status": "done", "data": { "features": [ { "name": "Tenure", "importance": 0.354 }, ... ] } },
    "viz": { "status": "done", "data": { "correlation_matrix": [...], "histograms": {...} } }
  }
}"""
    story.append(Paragraph(code_content.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))
    
    story.append(Paragraph("4.2 Next.js Dashboard Mockup", h2_style))
    story.append(Paragraph(
        "The Next.js frontend uses this state to render a premium dashboard, showing the pipeline "
        "progress, performance charts (ROC curves, heatmaps), SHAP feature importance, "
        "and an AI chat assistant. Below is the generated dashboard interface mockup:",
        body_style
    ))
    
    if os.path.exists(local_image_path):
        story.append(Spacer(1, 4))
        story.append(Image(local_image_path, width=340, height=170, hAlign='CENTER'))
    else:
        story.append(Paragraph("[Dashboard Mockup Image Placeholder — File Missing]", body_style))
        
    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=page_callback, onLaterPages=page_callback)

if __name__ == '__main__':
    build_pdf()
