import os
import glob
import shutil
import re
from pathlib import Path
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# ── DESIGN SYSTEM COLOR MAPS ──────────────────────────────────────────────────
PRIMARY_COLOR = (15, 23, 42)     # Deep Slate Navy (#0F172A)
SECONDARY_COLOR = (71, 85, 105)  # Slate Gray (#475569)
ACCENT_COLOR = (13, 148, 136)    # Muted Teal (#0D9488)
TEXT_DARK = (30, 41, 59)         # Charcoal (#1E293B)
TEXT_MUTED = (100, 116, 139)     # Muted Slate (#64748B)

def set_cell_background(cell, color_hex):
    """Sets the background color of a cell using XML shading."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets padding inside a cell (in twips, where 1 inch = 1440 twips)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_callout_borders(cell, border_color_hex="0D9488"):
    """Adds a thick accent-colored left border and clears other borders for callout style."""
    tcPr = cell._tc.get_or_add_tcPr()
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color_hex}"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
    </w:tcBorders>
    '''
    tcPr.append(parse_xml(borders_xml))

def set_table_borders(table, border_color_hex="E2E8F0"):
    """Applies a clean, light grid layout to tables."""
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def add_rich_text_to_paragraph(p, rich_text, default_font_name="Segoe UI", default_size_pt=9.5, default_color_rgb=TEXT_DARK):
    """Parses HTML-like <b>, <i>, <code> tags and translates them to native runs."""
    tokens = re.split(r'(<b>|</b>|<i>|</i>|<code>|</code>)', rich_text)
    
    bold = False
    italic = False
    code = False
    
    for token in tokens:
        if token == "<b>":
            bold = True
        elif token == "</b>":
            bold = False
        elif token == "<i>":
            italic = True
        elif token == "</i>":
            italic = False
        elif token == "<code>":
            code = True
        elif token == "</code>":
            code = False
        else:
            if not token:
                continue
            run = p.add_run(token)
            run.font.name = "Consolas" if code else default_font_name
            run.font.size = Pt(default_size_pt - 1 if code else default_size_pt)
            
            if code:
                run.font.color.rgb = RGBColor(15, 23, 42)
            else:
                run.font.color.rgb = RGBColor(*default_color_rgb)
                
            run.font.bold = bold or code
            run.font.italic = italic

def add_paragraph_with_font(doc, text="", font_name="Segoe UI", size_pt=9.5, color_rgb=TEXT_DARK, bold=False, italic=False, space_before_pt=0, space_after_pt=6, line_spacing=1.15, alignment=WD_ALIGN_PARAGRAPH.LEFT):
    """Adds a standard paragraph styled with the design system."""
    p = doc.add_paragraph()
    p.alignment = alignment
    p.paragraph_format.space_before = Pt(space_before_pt)
    p.paragraph_format.space_after = Pt(space_after_pt)
    p.paragraph_format.line_spacing = line_spacing
    
    if text:
        add_rich_text_to_paragraph(p, text, font_name, size_pt, color_rgb)
    return p

def add_bullet_item(doc, rich_text, font_name="Segoe UI", size_pt=9.5, color_rgb=TEXT_DARK, space_after_pt=4):
    """Adds a clean hanging indent bullet list item with a teal square bullet."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.first_line_indent = Inches(-0.15)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after_pt)
    p.paragraph_format.line_spacing = 1.15
    
    # Custom colored bullet
    run_bullet = p.add_run("▪  ")
    run_bullet.font.name = font_name
    run_bullet.font.size = Pt(size_pt)
    run_bullet.font.color.rgb = RGBColor(*ACCENT_COLOR)
    run_bullet.font.bold = True
    
    add_rich_text_to_paragraph(p, rich_text, font_name, size_pt, color_rgb)
    return p

def add_numbered_item(doc, number_str, rich_text, font_name="Segoe UI", size_pt=9.5, color_rgb=TEXT_DARK, space_after_pt=4):
    """Adds a clean hanging indent numbered list item with a teal number prefix."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.first_line_indent = Inches(-0.15)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after_pt)
    p.paragraph_format.line_spacing = 1.15
    
    run_num = p.add_run(f"{number_str}  ")
    run_num.font.name = font_name
    run_num.font.size = Pt(size_pt)
    run_num.font.color.rgb = RGBColor(*ACCENT_COLOR)
    run_num.font.bold = True
    
    add_rich_text_to_paragraph(p, rich_text, font_name, size_pt, color_rgb)
    return p

def add_heading_1(doc, text):
    """Adds an H1 section divider."""
    return add_paragraph_with_font(
        doc, text, font_name="Segoe UI", size_pt=13.5, color_rgb=PRIMARY_COLOR, 
        bold=True, space_before_pt=12, space_after_pt=6
    )

def add_heading_2(doc, text):
    """Adds an H2 sub-section divider."""
    return add_paragraph_with_font(
        doc, text, font_name="Segoe UI", size_pt=10.5, color_rgb=ACCENT_COLOR, 
        bold=True, space_before_pt=8, space_after_pt=4
    )

def add_metadata_block(doc):
    """Creates a premium callout-style metadata block on the first page."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(7.0)
    
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    set_callout_borders(cell, "0D9488")
    
    p1 = cell.paragraphs[0]
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(3)
    p1.paragraph_format.line_spacing = 1.15
    add_rich_text_to_paragraph(p1, "<b>Submitted For:</b> ABB Technical Challenge")
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(3)
    p2.paragraph_format.line_spacing = 1.15
    add_rich_text_to_paragraph(p2, "<b>Date:</b> May 20, 2026")
    
    p3 = cell.add_paragraph()
    p3.paragraph_format.space_before = Pt(0)
    p3.paragraph_format.space_after = Pt(3)
    p3.paragraph_format.line_spacing = 1.15
    add_rich_text_to_paragraph(p3, "<b>Evaluation Focus:</b> Innovation, Technical Implementation, Industrial Relevance, Scalability & Robustness")
    
    p4 = cell.add_paragraph()
    p4.paragraph_format.space_before = Pt(0)
    p4.paragraph_format.space_after = Pt(0)
    p4.paragraph_format.line_spacing = 1.15
    add_rich_text_to_paragraph(p4, "<b>Scope:</b> End-to-End Firebase-Firestore Integrated AutoML Lifecycle")

def add_flow_table(doc, headers, descriptions):
    """Creates a 3-column structured step-by-step progress table."""
    table = doc.add_table(rows=2, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, "E2E8F0")
    
    col_widths = [Inches(2.33), Inches(2.33), Inches(2.33)]
    
    for i, title in enumerate(headers):
        cell = table.cell(0, i)
        cell.width = col_widths[i]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(title)
        run.font.name = "Segoe UI"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.bold = True
        
    for i, desc in enumerate(descriptions):
        cell = table.cell(1, i)
        cell.width = col_widths[i]
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        add_rich_text_to_paragraph(p, desc, "Segoe UI", 8.0, TEXT_DARK)

def add_model_table(doc):
    """Creates the task candidate algorithm classification lookup table."""
    rows_data = [
        ("Classification", "XGBoost Classifier (gradient boosting), Random Forest (bagging), Logistic Regression, Naive Bayes (fast baseline), MLP Neural Network (non-linear representations)"),
        ("Regression", "XGBoost Regressor, Random Forest Regressor, ElasticNet (regularized linear), MLP Regressor"),
        ("Clustering", "K-Means (centroid-based), DBSCAN (density-based), Agglomerative Clustering (hierarchical linkage)")
    ]
    
    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, "E2E8F0")
    
    col_widths = [Inches(1.5), Inches(5.5)]
    
    headers = ["Task Type", "Candidate Algorithms & Parameter Justifications"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.width = col_widths[i]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(h)
        run.font.name = "Segoe UI"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.bold = True
        
    for r_idx, (task_type, details) in enumerate(rows_data, start=1):
        cell_0 = table.cell(r_idx, 0)
        cell_0.width = col_widths[0]
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        set_cell_background(cell_0, bg_color)
        set_cell_margins(cell_0, top=60, bottom=60, left=80, right=80)
        p0 = cell_0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        p0.paragraph_format.space_before = Pt(0)
        add_rich_text_to_paragraph(p0, f"<b>{task_type}</b>", "Segoe UI", 8.0)
        
        cell_1 = table.cell(r_idx, 1)
        cell_1.width = col_widths[1]
        set_cell_background(cell_1, bg_color)
        set_cell_margins(cell_1, top=60, bottom=60, left=80, right=80)
        p1 = cell_1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.line_spacing = 1.15
        add_rich_text_to_paragraph(p1, details, "Segoe UI", 7.5)

def add_code_block(doc, code_str):
    """Inserts a styled, monospaced code container with alternating margins."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    cell = table.cell(0, 0)
    cell.width = Inches(7.0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
    </w:tcBorders>
    '''
    tcPr.append(parse_xml(borders_xml))
    
    lines = code_str.split("\n")
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.05
    
    for idx, line in enumerate(lines):
        if idx > 0:
            p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            
        nbsp_line = line.replace(" ", "\u00A0")
        run = p.add_run(nbsp_line)
        run.font.name = "Consolas"
        run.font.size = Pt(7.0)
        run.font.color.rgb = RGBColor(15, 23, 42)

def set_document_margins(doc):
    """Enforces standard 0.75-inch margins for optimal printable widths."""
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

def set_document_footer(doc):
    """Configures professional headers/footers with dynamic page counting fields."""
    for section in doc.sections:
        footer = section.footer
        p = footer.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        
        run = p.add_run("CONFIDENTIAL — TECHNICAL ARCHITECTURE SUBMISSION | ")
        run.font.name = "Segoe UI"
        run.font.size = Pt(8.0)
        run.font.color.rgb = RGBColor(*TEXT_MUTED)
        
        # Word dynamic field codes
        fldSimple_xml1 = f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>'
        fldSimple_xml2 = f'<w:fldSimple {nsdecls("w")} w:instr="NUMPAGES"/>'
        
        p.add_run("Page ").font.size = Pt(8.0)
        p._p.append(parse_xml(fldSimple_xml1))
        p.add_run(" of ").font.size = Pt(8.0)
        p._p.append(parse_xml(fldSimple_xml2))
        
        for r in p.runs:
            r.font.name = "Segoe UI"
            r.font.size = Pt(8.0)
            r.font.color.rgb = RGBColor(*TEXT_MUTED)

def build_docx():
    docx_filename = "../DataCopilot_Submission.docx"
    doc = Document()
    set_document_margins(doc)
    set_document_footer(doc)
    
    # ── FIND AND COPY DASHBOARD MOCKUP IMAGE ──────────────────────────────────
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
    add_paragraph_with_font(doc, "DATACOPILOT", font_name="Segoe UI", size_pt=24, color_rgb=PRIMARY_COLOR, bold=True, space_after_pt=4, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph_with_font(doc, "AI-Driven AutoML & Conversational Insights Engine", font_name="Segoe UI", size_pt=11, color_rgb=SECONDARY_COLOR, space_after_pt=18, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    
    add_metadata_block(doc)
    add_paragraph_with_font(doc, "", space_after_pt=8)
    
    add_heading_1(doc, "1. Executive Summary")
    add_paragraph_with_font(doc, 
        "DataCopilot is a production-ready, full-stack Automated Machine Learning (AutoML) platform that bridges "
        "high-fidelity statistical modeling with explainable AI and conversational natural language querying. "
        "Built on a serverless, document-oriented architecture, DataCopilot verifies user identity via Google "
        "Sign-In, stores per-user sessions in Google Cloud Firestore, executes parallel model training workflows "
        "locally on FastAPI background threads, and streams step-by-step progress directly to a Next.js front-end "
        "using real-time WebSockets. This setup removes architectural complexity (no SQL database is required) "
        "while providing stateful, multi-user workspace isolation."
    )
    
    add_heading_1(doc, "2. Inputs Considered")
    add_paragraph_with_font(doc, 
        "The DataCopilot pipeline accepts specific data, system config, and credential files "
        "to run the automated workflow and secure downstream user transactions:"
    )
    
    add_heading_2(doc, "2.1 Data and Schema Inputs")
    add_bullet_item(doc, "<b>Structured Tabular Datasets:</b> Standard Comma-Separated (<code>.csv</code>) or JavaScript Object Notation (<code>.json</code>) files uploaded via multipart POST requests.")
    add_bullet_item(doc, "<b>Schema Properties:</b> User-defined target column headers, or an inferred target keyword parsed from raw headers (e.g. <i>target, label, class, price, churn</i>).")
    add_bullet_item(doc, "<b>Temporal Columns:</b> Date/time columns detected automatically by scanning columns for datetime types or headers matching temporal keywords (e.g. <i>date, time, timestamp</i>).")
    add_bullet_item(doc, "<b>User Session UUID:</b> Unique identifiers generated per dataset upload to organize Firestore records and segment workspace cache directories.")
    
    add_heading_2(doc, "2.2 Authentication, Credentials & System Configs")
    add_bullet_item(doc, "<b>Firebase Admin Key Store:</b> Private JSON service account certificate (<code>serviceAccountKey.json</code>) loaded on the server to authenticate and authorize Firestore operations.")
    add_bullet_item(doc, "<b>Bearer Token Header:</b> A cryptographically signed Firebase ID token (JWT) passed in the HTTP header (<code>Authorization: Bearer &lt;token&gt;</code>) to authorize protected REST/WS endpoints.")
    add_bullet_item(doc, "<b>Language Model API Keys:</b> Private keys for Google Gemini Pro (main reasoning agent) and Groq Llama-3-70b (failover engine) stored in server-side <code>.env</code> configurations.")
    add_bullet_item(doc, "<b>Firebase Client Environment Variables:</b> Web API configuration details (<code>apiKey</code>, <code>authDomain</code>, <code>projectId</code>) used to initialize client-side Google Sign-In.")
    
    doc.add_page_break()

    # =========================================================================
    # PAGE 2: PROCESS TO BE FOLLOWED — PART 1: DATA INTAKE & PROFILE
    # =========================================================================
    add_heading_1(doc, "3. Core AutoML Process to be Followed")
    add_paragraph_with_font(doc, 
        "DataCopilot executes an orchestrated 9-step pipeline to transform raw, noisy datasets into fully "
        "evaluated models backed by explainable artificial intelligence. The flowchart of operations spans "
        "data ingestion, statistical analysis, preprocessing, training, evaluation, and explanation."
    )
    
    # Ingestion diagram table
    flow_headers_1 = ["Step 1: Upload & Auth", "Step 2: Profile & Stats", "Step 3: Task & Imbalance"]
    flow_descs_1 = [
        "FastAPI intercepts and verifies Bearer JWT tokens via Firebase Admin. Saves files and creates Firestore doc: <code>users/{uid}/sessions/{session_id}</code>.",
        "Loads file in Pandas to compute null ratios, categorical frequencies, duplicate counts, and descriptive numeric distributions.",
        "Detects target and temporal columns; infers ML task type (Classification vs. Regression vs. Clustering). Flags class imbalance (>75%)."
    ]
    add_flow_table(doc, flow_headers_1, flow_descs_1)
    add_paragraph_with_font(doc, "", space_after_pt=6)

    add_heading_2(doc, "Phase 1: Ingestion & Firebase Authentication Gate")
    add_paragraph_with_font(doc, 
        "Every protected request is intercepted by FastAPI middleware (<code>auth_middleware.py</code>), "
        "which extracts the Bearer token and verifies it against the Firebase Admin SDK, yielding the user's "
        "unique <code>uid</code>. The endpoint saves the raw file to <code>backend/workspace/uploads/</code> "
        "and creates a stateful session record in Firestore. This architecture links database ownership to the "
        "authenticated user. A WebSocket endpoint is established (<code>ws/analysis/{session_id}</code>) to stream "
        "subsequent task outputs in real-time."
    )
    
    add_heading_2(doc, "Phase 2: Comprehensive Profiling & Diagnostics")
    add_paragraph_with_font(doc, 
        "Once files are saved, a background worker loads the dataset using Pandas. It computes missing "
        "value ratios, duplicates, data types, and core statistics (mean, standard deviation, and quantiles "
        "for numeric columns; top-5 category distributions for objects). The resulting profile metadata is "
        "serialized, saved to the Firestore session record, and emitted via WebSocket to drive the frontend UI."
    )
    
    add_heading_2(doc, "Phase 3: Task Classification & Imbalance Engineering")
    add_paragraph_with_font(doc, 
        "DataCopilot determines the machine learning objective through automated classification heuristics:"
    )
    add_numbered_item(doc, "1.", "<b>Target Auto-Detection:</b> The system scans column names for target keywords. If none are found and no target is selected, it defaults to an unsupervised <b>Clustering</b> task.")
    add_numbered_item(doc, "2.", "<b>Temporal Detection:</b> Scanning for date/time keywords flags the session for <b>Time Series</b> forecasting.")
    add_numbered_item(doc, "3.", "<b>Task Selection:</b> For standard supervised datasets, the system checks target cardinality. Numeric targets with &gt; 15 unique values are classified as <b>Regression</b>; target values with &le; 15 values are classified as <b>Binary</b> or <b>Multi-class Classification</b>.")
    add_numbered_item(doc, "4.", "<b>Imbalance Checks:</b> For classification tasks, the system computes the majority class ratio. If any single class represents &gt; 75% of the dataset, it sets an <code>is_imbalanced</code> flag, which triggers class-weight balancing configurations in downstream training.")
    
    doc.add_page_break()

    # =========================================================================
    # PAGE 3: PROCESS TO BE FOLLOWED — PART 2: PREPROCESS & MODEL SELECTION
    # =========================================================================
    add_heading_1(doc, "3. Core AutoML Process to be Followed (Continued)")
    add_paragraph_with_font(doc, 
        "Following task identification, the pipeline processes the data to make it compatible with machine "
        "learning algorithms and selects optimal candidate models for competitive cross-validation."
    )
    
    # Preprocessing diagram table
    flow_headers_2 = ["Step 4: Preprocessing", "Step 5: Recommend Models", "Step 6: Threaded CV Train"]
    flow_descs_2 = [
        "Prunes sparse columns (>75% null). Imputes median/mode, encodes categories, and scales features via StandardScaler.",
        "Recommends a list of candidate algorithms (XGBoost, RandomForest, MLP) custom-suited to the detected task.",
        "Runs Stratified K-Fold or Time Series splits locally on server CPU threads. Streams progress updates fold-by-fold."
    ]
    add_flow_table(doc, flow_headers_2, flow_descs_2)
    add_paragraph_with_font(doc, "", space_after_pt=6)

    add_heading_2(doc, "Phase 4: Automated Preprocessing & Feature Engineering")
    add_paragraph_with_font(doc, 
        "To prepare raw tabular features for scikit-learn and XGBoost pipelines, the engine applies transformations:"
    )
    add_bullet_item(doc, "<b>Column Pruning:</b> Columns with more than 75% missing data are pruned to reduce feature noise.")
    add_bullet_item(doc, "<b>Imputation:</b> Missing continuous values are imputed with column medians; missing categorical variables are imputed with column modes. Imputation constants are cached for inference reproducibility.")
    add_bullet_item(doc, "<b>Feature Encoding:</b> Continuous variables are standardized (zero mean, unit variance) via <code>StandardScaler</code>. Categorical variables are One-Hot Encoded if they have &le; 10 unique levels; otherwise, they are Label Encoded.")
    
    add_heading_2(doc, "Phase 5: Candidate Model Recommendations")
    add_paragraph_with_font(doc, 
        "Instead of training a single model, DataCopilot defines a tailored search space based on the inferred task, "
        "recommending candidate architectures with detailed technical parameters:"
    )
    add_model_table(doc)
    add_paragraph_with_font(doc, "", space_after_pt=6)

    add_heading_2(doc, "Phase 6: Threaded Training & Cross-Validation")
    add_paragraph_with_font(doc, 
        "All machine learning models are trained locally on the server CPU. Because training is computationally intensive, "
        "running it directly in FastAPI's async loop would block other WebSocket events and lock user pages. "
        "To prevent this, the training pipeline runs inside a background thread pool executor (<code>run_in_executor</code>). "
        "Overfitting is minimized through cross-validation splits (K = min(5, max(2, N/30))). "
        "The system uses <code>StratifiedKFold</code> for classification (to preserve imbalanced target bounds) "
        "and <code>TimeSeriesSplit</code> for temporal forecasting. Progress and training logs are pushed live via WebSocket fold-by-fold."
    )
    
    doc.add_page_break()

    # =========================================================================
    # PAGE 4: PROCESS TO BE FOLLOWED — PART 3: EVALUATION, SHAP, & COPILOT
    # =========================================================================
    add_heading_1(doc, "3. Core AutoML Process to be Followed (Continued)")
    add_paragraph_with_font(doc, 
        "The final phases of the pipeline compute diagnostic evaluation metrics, explain the "
        "underlying model behavior using SHAP values, and initialize the conversational LLM interface."
    )
    
    # Process diagram 3
    flow_headers_3 = ["Step 7: Evaluate Test Set", "Step 8: SHAP Explainability", "Step 9: LangChain Chat"]
    flow_descs_3 = [
        "Tests models on a 20% holdout split. Computes Accuracy, F1, ROC-AUC, R², Silhouette, and Confusion Matrices.",
        "Attributes predictions using SHAP values. Implements multi-tier fallbacks (tree, kernel, importances, coefficients).",
        "Spawns a conversational agent in LangChain. Reads session variables from Firestore, calling Gemini or Groq APIs."
    ]
    add_flow_table(doc, flow_headers_3, flow_descs_3)
    add_paragraph_with_font(doc, "", space_after_pt=6)

    add_heading_2(doc, "Phase 7: Model Evaluation & Holdout Testing")
    add_paragraph_with_font(doc, 
        "A separate 20% holdout test dataset is set aside to evaluate model generalization. "
        "The backend trains each candidate model on the training fold, predicts on the test set, and calculates "
        "a wide range of metrics: Classification models compute Accuracy, Precision, Recall, F1-Score, and "
        "ROC-AUC; Regression models calculate R², MAE, RMSE, and MAPE; Clustering models calculate Silhouette "
        "Scores and the Davies-Bouldin Index. For classification, the system also computes a complete "
        "Confusion Matrix and ROC curve coordinates for the best-performing model (based on CV score)."
    )
    
    add_heading_2(doc, "Phase 8: SHAP Interpretability & Feature Attribution")
    add_paragraph_with_font(doc, 
        "To provide model transparency, DataCopilot computes SHAP (SHapley Additive exPlanations) values "
        "for the best-performing model. Because SHAP calculations can be computationally intensive, the backend "
        "features a robust, multi-tier fallback architecture to guarantee zero-crash execution:"
    )
    add_numbered_item(doc, "1.", "<b>TreeExplainer:</b> Activated for tree-based ensemble models (XGBoost, Random Forest) to compute exact SHAP values quickly.")
    add_numbered_item(doc, "2.", "<b>KernelExplainer:</b> Activated for non-tree models (KNN, MLP), sampling a small background dataset (up to 50 rows) to estimate feature impacts.")
    add_numbered_item(doc, "3.", "<b>Feature Importances Fallback:</b> Extracted directly using the model's native <code>feature_importances_</code> if explainer calculations fail.")
    add_numbered_item(doc, "4.", "<b>Linear Coefficients Fallback:</b> Extracted by averaging absolute model weights (<code>coef_</code>) if a linear baseline is chosen.")
    
    add_heading_2(doc, "Phase 9: Conversational AI & LangChain Agent Context")
    add_paragraph_with_font(doc, 
        "Upon pipeline completion, the backend compiles the data profile, model scores, and SHAP features "
        "into a structured payload. This is passed to a background thread to generate an initial AI analysis "
        "using Google Gemini or Groq. The prompt instructs the LLM to explain the model choice, "
        "explain which features drive performance, point out any data anomalies, and offer business recommendations. "
        "This response is saved in Firestore as the session's <code>ai_insight</code> and sent to the client. "
        "Users can then ask follow-up questions in the chat interface, which is powered by LangChain "
        "and retrieves past messages from Firestore to maintain conversation context."
    )
    
    doc.add_page_break()

    # =========================================================================
    # PAGE 5: EXPECTED OUTPUT
    # =========================================================================
    add_heading_1(doc, "4. Expected Outputs")
    add_paragraph_with_font(doc, 
        "The DataCopilot system generates two primary types of outputs: a structured database "
        "state containing detailed machine learning metadata, and an interactive frontend dashboard UI."
    )
    
    add_heading_2(doc, "4.1 Structured Firestore Session Schema (Per-User Storage)")
    add_paragraph_with_font(doc, 
        "The ultimate output of the pipeline is a rich JSON document persisted in Firestore under a unique "
        "<code>session_id</code>. This structured record enables full reproducibility and is defined as follows:"
    )
    
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
    add_code_block(doc, code_content)
    add_paragraph_with_font(doc, "", space_after_pt=4)
    
    add_heading_2(doc, "4.2 Next.js Dashboard Mockup & Client Contexts")
    add_paragraph_with_font(doc, 
        "The Next.js frontend uses state contexts to manage and render a premium, responsive dashboard: "
        "<code>AuthContext</code> maintains user states and injects JWT authorization headers, while <code>SessionContext</code> "
        "manages the active WebSocket connection. Real-time metrics are rendered in a sleek dark-themed dashboard:"
    )
    
    if os.path.exists(local_image_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run()
        run.add_picture(local_image_path, width=Inches(4.5))
    else:
        add_paragraph_with_font(doc, "[Dashboard Mockup Image Placeholder — File Missing]", alignment=WD_ALIGN_PARAGRAPH.CENTER)

    doc.save(docx_filename)
    print(f"DOCX compilation complete: {docx_filename}")

if __name__ == '__main__':
    build_docx()
