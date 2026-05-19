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

# Page callback to track where things break
def page_callback(canvas, doc):
    print(f"Page callback: completed page {doc.page}")

def build_pdf():
    pdf_filename = "../DataCopilot_Submission.pdf"
    
    # 8.5 x 11 inches: Width = 612, Height = 792. Margins = 54 (0.75 in).
    # Setting top and bottom margin to 60 pt to prevent overflow and keep layout clean
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
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=SECONDARY_COLOR,
        alignment=1, # Center
        spaceAfter=16
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=PRIMARY_COLOR,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
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
        leading=12,
        textColor=TEXT_DARK,
        spaceAfter=4
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )
    
    numbered_style = ParagraphStyle(
        'NumberedText',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
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
        leading=9.5,
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
    
    # Accent metadata block table (Callout-style with vertical accent bar)
    meta_data = [
        [Paragraph("<b>Submitted For:</b> ABB Technical Challenge", body_style),
         Paragraph("<b>Date:</b> May 20, 2026", body_style)],
        [Paragraph("<b>Evaluation Focus:</b> Innovation, Technical Implementation, Industrial Relevance, Scalability & Robustness", body_style),
         Paragraph("<b>Scope:</b> End-to-End Firebase-Firestore Integrated AutoML Lifecycle", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[260, 244])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('LINEBEFORE', (0,0), (0,-1), 3.0, ACCENT_COLOR), # Bold Teal vertical line on left
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "DataCopilot is a production-ready, full-stack Automated Machine Learning (AutoML) platform that bridges "
        "high-fidelity statistical modeling with explainable AI and conversational natural language querying. "
        "Built on a serverless, document-oriented architecture, DataCopilot verifies user identity via Google "
        "Sign-In, stores per-user sessions in Google Cloud Firestore, executes parallel model training workflows "
        "locally on FastAPI background threads, and streams step-by-step progress directly to a Next.js front-end "
        "using real-time WebSockets. This setup removes architectural complexity (no SQL database is required) "
        "while providing stateful, multi-user workspace isolation.",
        body_style
    ))
    
    story.append(Paragraph("2. Inputs Considered", h1_style))
    story.append(Paragraph(
        "The DataCopilot pipeline accepts specific data, system config, and credential files "
        "to run the automated workflow and secure downstream user transactions:",
        body_style
    ))
    
    story.append(Paragraph("2.1 Data and Schema Inputs", h2_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Structured Tabular Datasets:</b> Standard Comma-Separated (<code>.csv</code>) or JavaScript Object Notation (<code>.json</code>) files uploaded via multipart POST requests.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Schema Properties:</b> User-defined target column headers, or an inferred target keyword parsed from raw headers (e.g. <i>target, label, class, price, churn</i>).", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Temporal Columns:</b> Date/time columns detected automatically by scanning columns for datetime types or headers matching temporal keywords (e.g. <i>date, time, timestamp</i>).", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>User Session UUID:</b> Unique identifiers generated per dataset upload to organize Firestore records and segment workspace cache directories.", bullet_style))
    
    story.append(Paragraph("2.2 Authentication, Credentials & System Configs", h2_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Firebase Admin Key Store:</b> Private JSON service account certificate (<code>serviceAccountKey.json</code>) loaded on the server to authenticate and authorize Firestore operations.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Bearer Token Header:</b> A cryptographically signed Firebase ID token (JWT) passed in the HTTP header (<code>Authorization: Bearer &lt;token&gt;</code>) to authorize protected REST/WS endpoints.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Language Model API Keys:</b> Private keys for Google Gemini Pro (main reasoning agent) and Groq Llama-3-70b (failover engine) stored in server-side <code>.env</code> configurations.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Firebase Client Environment Variables:</b> Web API configuration details (<code>apiKey</code>, <code>authDomain</code>, <code>projectId</code>) used to initialize client-side Google Sign-In.", bullet_style))
    
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
        [Paragraph("<b>Step 1: Upload & Auth</b>", table_header_style), 
         Paragraph("<b>Step 2: Profile & Stats</b>", table_header_style), 
         Paragraph("<b>Step 3: Task & Imbalance</b>", table_header_style)],
        [Paragraph("FastAPI intercepts and verifies Bearer JWT tokens via Firebase Admin. Saves files and creates Firestore doc: <code>users/{uid}/sessions/{session_id}</code>.", table_body_style),
         Paragraph("Loads file in Pandas to compute null ratios, categorical frequencies, duplicate counts, and descriptive numeric distributions.", table_body_style),
         Paragraph("Detects target and temporal columns; infers ML task type (Classification vs. Regression vs. Clustering). Flags class imbalance (>75%).", table_body_style)]
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

    story.append(Paragraph("Phase 1: Ingestion & Firebase Authentication Gate", h2_style))
    story.append(Paragraph(
        "Every protected request is intercepted by FastAPI middleware (<code>auth_middleware.py</code>), "
        "which extracts the Bearer token and verifies it against the Firebase Admin SDK, yielding the user's "
        "unique <code>uid</code>. The endpoint saves the raw file to <code>backend/workspace/uploads/</code> "
        "and creates a stateful session record in Firestore. This architecture links database ownership to the "
        "authenticated user. A WebSocket endpoint is established (<code>ws/analysis/{session_id}</code>) to stream "
        "subsequent task outputs in real-time.",
        body_style
    ))
    
    story.append(Paragraph("Phase 2: Comprehensive Profiling & Diagnostics", h2_style))
    story.append(Paragraph(
        "Once files are saved, a background worker loads the dataset using Pandas. It computes missing "
        "value ratios, duplicates, data types, and core statistics (mean, standard deviation, and quantiles "
        "for numeric columns; top-5 category distributions for objects). The resulting profile metadata is "
        "serialized, saved to the Firestore session record, and emitted via WebSocket to drive the frontend UI.",
        body_style
    ))
    
    story.append(Paragraph("Phase 3: Task Classification & Imbalance Engineering", h2_style))
    story.append(Paragraph(
        "DataCopilot determines the machine learning objective through automated classification heuristics:",
        body_style
    ))
    story.append(Paragraph("1.&nbsp;&nbsp;<b>Target Auto-Detection:</b> The system scans column names for target keywords. If none are found and no target is selected, it defaults to an unsupervised <b>Clustering</b> task.", numbered_style))
    story.append(Paragraph("2.&nbsp;&nbsp;<b>Temporal Detection:</b> Scanning for date/time keywords flags the session for <b>Time Series</b> forecasting.", numbered_style))
    story.append(Paragraph("3.&nbsp;&nbsp;<b>Task Selection:</b> For standard supervised datasets, the system checks target cardinality. Numeric targets with &gt; 15 unique values are classified as <b>Regression</b>; target values with &le; 15 values are classified as <b>Binary</b> or <b>Multi-class Classification</b>.", numbered_style))
    story.append(Paragraph("4.&nbsp;&nbsp;<b>Imbalance Checks:</b> For classification tasks, the system computes the majority class ratio. If any single class represents &gt; 75% of the dataset, it sets an <code>is_imbalanced</code> flag, which triggers class-weight balancing configurations in downstream training.", numbered_style))
    
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
         Paragraph("<b>Step 5: Recommend Models</b>", table_header_style), 
         Paragraph("<b>Step 6: Threaded CV Train</b>", table_header_style)],
        [Paragraph("Prunes sparse columns (>75% null). Imputes median/mode, encodes categories, and scales features via StandardScaler.", table_body_style),
         Paragraph("Recommends a list of candidate algorithms (XGBoost, RandomForest, MLP) custom-suited to the detected task.", table_body_style),
         Paragraph("Runs Stratified K-Fold or Time Series splits locally on server CPU threads. Streams progress updates fold-by-fold.", table_body_style)]
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

    story.append(Paragraph("Phase 4: Automated Preprocessing & Feature Engineering", h2_style))
    story.append(Paragraph(
        "To prepare raw tabular features for scikit-learn and XGBoost pipelines, the engine applies transformations:",
        body_style
    ))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Column Pruning:</b> Columns with more than 75% missing data are pruned to reduce feature noise.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Imputation:</b> Missing continuous values are imputed with column medians; missing categorical variables are imputed with column modes. Imputation constants are cached for inference reproducibility.", bullet_style))
    story.append(Paragraph("&bull;&nbsp;&nbsp;<b>Feature Encoding:</b> Continuous variables are standardized (zero mean, unit variance) via <code>StandardScaler</code>. Categorical variables are One-Hot Encoded if they have &le; 10 unique levels; otherwise, they are Label Encoded.", bullet_style))
    
    story.append(Paragraph("Phase 5: Candidate Model Recommendations", h2_style))
    story.append(Paragraph(
        "Instead of training a single model, DataCopilot defines a tailored search space based on the inferred task, "
        "recommending candidate architectures with detailed technical parameters:",
        body_style
    ))
    
    # Table of models
    model_rows = [
        [Paragraph("<b>Task Type</b>", table_header_style), Paragraph("<b>Candidate Algorithms & Parameter Justifications</b>", table_header_style)],
        [Paragraph("Classification", table_body_style), Paragraph("XGBoost Classifier (gradient boosting), Random Forest (bagging), Logistic Regression, Naive Bayes (fast baseline), MLP Neural Network (non-linear representations)", table_body_style)],
        [Paragraph("Regression", table_body_style), Paragraph("XGBoost Regressor, Random Forest Regressor, ElasticNet (regularized linear), MLP Regressor", table_body_style)],
        [Paragraph("Clustering", table_body_style), Paragraph("K-Means (centroid-based), DBSCAN (density-based), Agglomerative Clustering (hierarchical linkage)", table_body_style)]
    ]
    model_table = Table(model_rows, colWidths=[90, 414])
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

    story.append(Paragraph("Phase 6: Threaded Training & Cross-Validation", h2_style))
    story.append(Paragraph(
        "All machine learning models are trained locally on the server CPU. Because training is computationally intensive, "
        "running it directly in FastAPI's async loop would block other WebSocket events and lock user pages. "
        "To prevent this, the training pipeline runs inside a background thread pool executor (<code>run_in_executor</code>). "
        "Overfitting is minimized through cross-validation splits (K = min(5, max(2, N/30))). "
        "The system uses <code>StratifiedKFold</code> for classification (to preserve imbalanced target bounds) "
        "and <code>TimeSeriesSplit</code> for temporal forecasting. Progress and training logs are pushed live via WebSocket fold-by-fold.",
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
        [Paragraph("<b>Step 7: Evaluate Test Set</b>", table_header_style), 
         Paragraph("<b>Step 8: SHAP Explainability</b>", table_header_style), 
         Paragraph("<b>Step 9: LangChain Chat</b>", table_header_style)],
        [Paragraph("Tests models on a 20% holdout split. Computes Accuracy, F1, ROC-AUC, R², Silhouette, and Confusion Matrices.", table_body_style),
         Paragraph("Attributes predictions using SHAP values. Implements multi-tier fallbacks (tree, kernel, importances, coefficients).", table_body_style),
         Paragraph("Spawns a conversational agent in LangChain. Reads session variables from Firestore, calling Gemini or Groq APIs.", table_body_style)]
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

    story.append(Paragraph("Phase 7: Model Evaluation & Holdout Testing", h2_style))
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
        "for the best-performing model. Because SHAP calculations can be computationally intensive, the backend "
        "features a robust, multi-tier fallback architecture to guarantee zero-crash execution:",
        body_style
    ))
    story.append(Paragraph("1.&nbsp;&nbsp;<b>TreeExplainer:</b> Activated for tree-based ensemble models (XGBoost, Random Forest) to compute exact SHAP values quickly.", numbered_style))
    story.append(Paragraph("2.&nbsp;&nbsp;<b>KernelExplainer:</b> Activated for non-tree models (KNN, MLP), sampling a small background dataset (up to 50 rows) to estimate feature impacts.", numbered_style))
    story.append(Paragraph("3.&nbsp;&nbsp;<b>Feature Importances Fallback:</b> Extracted directly using the model's native <code>feature_importances_</code> if explainer calculations fail.", numbered_style))
    story.append(Paragraph("4.&nbsp;&nbsp;<b>Linear Coefficients Fallback:</b> Extracted by averaging absolute model weights (<code>coef_</code>) if a linear baseline is chosen.", numbered_style))
    
    story.append(Paragraph("Phase 9: Conversational AI & LangChain Agent Context", h2_style))
    story.append(Paragraph(
        "Upon pipeline completion, the backend compiles the data profile, model scores, and SHAP features "
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
    
    story.append(Paragraph("4.1 Structured Firestore Session Schema (Per-User Storage)", h2_style))
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
    "shap": { "status": "done", "data": { "features": [ { "name": "Tenure", "importance": 0.354 } ] } },
    "viz": { "status": "done", "data": { "correlation_matrix": [...], "histograms": {...} } }
  }
}"""
    story.append(Paragraph(code_content.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))
    
    story.append(Paragraph("4.2 Next.js Dashboard Mockup & Client Contexts", h2_style))
    story.append(Paragraph(
        "The Next.js frontend uses state contexts to manage and render a premium, responsive dashboard: "
        "<code>AuthContext</code> maintains user states and injects JWT authorization headers, while <code>SessionContext</code> "
        "manages the active WebSocket connection. Real-time metrics are rendered in a sleek dark-themed dashboard:",
        body_style
    ))
    
    if os.path.exists(local_image_path):
        story.append(Spacer(1, 3))
        story.append(Image(local_image_path, width=340, height=170, hAlign='CENTER'))
    else:
        story.append(Paragraph("[Dashboard Mockup Image Placeholder — File Missing]", body_style))
        
    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=page_callback, onLaterPages=page_callback)

if __name__ == '__main__':
    build_pdf()
