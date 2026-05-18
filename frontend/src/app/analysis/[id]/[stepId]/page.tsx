"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StepTracker from "@/components/analysis/StepTracker";
import NeonButton from "@/components/ui/NeonButton";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS_SEQUENCE = [
  { id: "upload", label: "Dataset Ingest", detail: "Loaded titanic.csv · 891 rows", duration: 0.3 },
  { id: "analyze", label: "Data Profile", detail: "Analyzed features & missing values", duration: 1.1 },
  { id: "task", label: "Task Detection", detail: "Target: Survived (Binary Classification)", duration: 0.8 },
  { id: "preprocess", label: "Data Prep", detail: "Imputed age · Encoded category inputs", duration: 2.3 },
  { id: "recommend", label: "Model Selection", detail: "Chose XGBoost, RF, LogReg, SVM", duration: 1.0 },
  { id: "train", label: "Model Training", detail: "Running 5-fold CV benchmarks", duration: 4.2 },
  { id: "evaluate", label: "Evaluation", detail: "Winner: XGBoost (83.4% accuracy)", duration: 1.5 },
  { id: "shap", label: "SHAP Explainability", detail: "Computed top feature attributions", duration: 2.1 },
  { id: "viz", label: "Visualizations", detail: "Generated ROC & correlation charts", duration: 1.0 },
];

type StepStatus = "pending" | "running" | "done" | "error";

export default function StepDetailPage({ params }: { params: Promise<{ id: string; stepId: string }> | any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sessionId, setSessionId] = useState<string>("");
  const [stepId, setStepId] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Safely unwrap parameters
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => {
        setSessionId(p.id);
        setStepId(p.stepId);
      });
    } else if (params && typeof params === "object") {
      setSessionId(params.id || "demo");
      setStepId(params.stepId || "upload");
    }
  }, [params]);

  // Set initial elapsed time from query param, or fallback based on current step index
  useEffect(() => {
    const elapsedQuery = searchParams.get("elapsed");
    if (elapsedQuery) {
      setElapsed(parseFloat(elapsedQuery));
    } else {
      const idx = STEPS_SEQUENCE.findIndex(s => s.id === stepId);
      setElapsed(idx >= 0 ? idx * 1.5 + 1.0 : 0);
    }
  }, [stepId, searchParams]);

  // Sync currentStep progression based on elapsed time
  useEffect(() => {
    const idx = STEPS_SEQUENCE.findIndex(s => s.id === stepId);
    setCurrentStep(idx >= 0 ? idx : 0);
  }, [stepId]);

  // Background timer (keeps running during inspect!)
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(timer);
  }, [done]);

  // Background step progress advancer (keeps running!)
  useEffect(() => {
    if (currentStep >= STEPS_SEQUENCE.length) {
      setDone(true);
      return;
    }
    const step = STEPS_SEQUENCE[currentStep];
    const delay = step ? (step.duration ?? 1) * 1000 : 800;
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const steps = STEPS_SEQUENCE.map((s, i) => ({
    ...s,
    status: (i < currentStep ? "done" : i === currentStep ? "running" : "pending") as StepStatus,
  }));

  const progress = done ? 100 : Math.min(((currentStep + 1) / STEPS_SEQUENCE.length) * 100, 99);

  const handleStepSelect = (newStepId: string) => {
    router.push(`/analysis/${sessionId}/${newStepId}?elapsed=${elapsed.toFixed(1)}`);
  };

  const themeColors: Record<string, string> = {
    upload: "var(--cyan)",
    analyze: "var(--amber)",
    task: "var(--cyan)",
    preprocess: "var(--purple)",
    recommend: "var(--green)",
    train: "var(--purple)",
    evaluate: "var(--green)",
    shap: "var(--pink)",
    viz: "var(--cyan)",
  };
  const accentColor = themeColors[stepId] || "var(--cyan)";

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ paddingTop: 100, maxWidth: 1300, margin: "0 auto", padding: "100px 24px 80px" }}>
        
        {/* Header with Return link */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span 
                onClick={() => router.push(`/analysis/${sessionId}`)}
                style={{ cursor: "pointer", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", textDecoration: "underline" }}
              >
                &lt;- Back to Pipeline
              </span>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)" }}>· session: {sessionId}</span>
            </div>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "var(--text-bright)", marginBottom: 6 }}>
              Step Details: {STEPS_SEQUENCE.find(s => s.id === stepId)?.label}
            </h1>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>
              Running in background · Elapsed: {elapsed.toFixed(1)}s
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <NeonButton onClick={() => router.push(`/analysis/${sessionId}`)} variant="cyan" size="sm">
              Overview Dashboard
            </NeonButton>
            {done && (
              <NeonButton href={`/results/${sessionId}`} variant="solid-cyan" size="sm">
                View Finished Results
              </NeonButton>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--bg-panel)", marginBottom: 32, border: "1px solid var(--border-faint)" }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Spacious Dashboard Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32, alignItems: "start" }}>
          
          {/* LEFT COLUMN: Pipeline Tracker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ border: "1px dashed rgba(0, 245, 255, 0.2)", background: "rgba(0, 245, 255, 0.01)", padding: "12px 16px" }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", margin: 0 }}>
                // INSPECT MODE: Click any step to switch details pages.
              </p>
            </div>
            <StepTracker 
              steps={steps} 
              selectedStepId={stepId}
              onStepSelect={handleStepSelect}
            />
          </div>

          {/* RIGHT COLUMN: Spacious Step-Specific Full Dashboard Component */}
          <div className="cyber-card" style={{
            background: "var(--bg-card)",
            border: `1px solid ${accentColor}`,
            padding: "28px",
            position: "relative",
            boxShadow: `0 0 30px ${accentColor}08`
          }}>
            {/* Brackets */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 16, height: 16, borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 16, height: 16, borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` }} />

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: accentColor, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
                // PROCESS DOCUMENTATION
              </p>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-bright)", marginTop: 4, marginBottom: 8 }}>
                {STEPS_SEQUENCE.find(s => s.id === stepId)?.label} Data Scope
              </h2>
              <div style={{ height: 1, background: "var(--border-faint)", width: "100%", marginTop: 12 }} />
            </div>

            <ModalContentSelector stepId={stepId} accentColor={accentColor} />
          </div>

        </div>
      </div>
    </main>
  );
}

/* ======================================================
   SUBCOMPONENT: RENDER STEP DETAILS
   ====================================================== */
function ModalContentSelector({ stepId, accentColor }: { stepId: string; accentColor: string }) {
  switch (stepId) {
    case "upload":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Loaded Dataset Preview (titanic.csv)</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            The file was uploaded successfully. The first 5 records are parsed below to display the row structure:
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--border-faint)", background: "#03030a" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Fira Code, monospace", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-dim)", background: "rgba(255,255,255,0.02)" }}>
                  {["PassengerId", "Survived", "Pclass", "Name", "Sex", "Age", "SibSp", "Parch", "Fare"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: accentColor, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [1, 0, 3, "Braund, Mr. Owen Harris", "male", 22, 1, 0, 7.25],
                  [2, 1, 1, "Cumings, Mrs. John Bradley", "female", 38, 1, 0, 71.28],
                  [3, 1, 3, "Heikkinen, Miss. Laina", "female", 26, 0, 0, 7.925],
                  [4, 1, 1, "Futrelle, Mrs. Jacques Heath", "female", 35, 1, 0, 53.1],
                  [5, 0, 3, "Allen, Mr. William Henry", "male", 35, 0, 0, 8.05],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-faint)" }}>
                    {row.map((val, k) => (
                      <td key={k} style={{ padding: "10px 12px", color: "var(--text-primary)" }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "analyze":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 16 }}>Missing Values & Profiling Summary</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Features profiled. Identified missing metrics and standard bounds. Spark bars show sparsity ratios:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: "Cabin", missing: 687, total: 891, pct: 77.1, color: "var(--pink)" },
              { name: "Age", missing: 177, total: 891, pct: 19.8, color: "var(--amber)" },
              { name: "Embarked", missing: 2, total: 891, pct: 0.2, color: "var(--cyan)" },
              { name: "Other Columns", missing: 0, total: 891, pct: 0, color: "var(--green)" },
            ].map(col => (
              <div key={col.name} style={{ border: "1px solid var(--border-faint)", background: "rgba(255,255,255,0.01)", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-bright)", fontWeight: 600 }}>{col.name}</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: col.color }}>{col.missing} nulls ({col.pct}%)</span>
                </div>
                <div style={{ height: 6, background: "#050510", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${col.pct || 1}%`, background: col.color, borderRadius: 3, boxShadow: `0 0 10px ${col.color}` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "task":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Target Class Balance (Survived)</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Determined target column distribution. Highly balanced target classes confirmed Binary Classification setting:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
            <div style={{ border: "1px solid var(--border-faint)", padding: 20, background: "rgba(0,245,255,0.01)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--cyan)" }}>342</div>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Survived (38.3%)</div>
            </div>
            <div style={{ border: "1px solid var(--border-faint)", padding: 20, background: "rgba(255,0,102,0.01)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--pink)" }}>549</div>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Deceased (61.7%)</div>
            </div>
          </div>
        </div>
      );

    case "preprocess":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Automated Transformation Matrix</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Applied data transformations to clean numerical columns and encode categorical structures:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { title: "Drop Sparsity", desc: "Dropped column 'Cabin' due to extreme void content (>75% null)." },
              { title: "Numeric Impute", desc: "Imputed column 'Age' using median (28.0) to handle missing fields." },
              { title: "One-Hot Encode", desc: "Encoded columns 'Sex' and 'Embarked' into binary vector features." },
              { title: "Feature Scaling", desc: "Scaled 'Age' and 'Fare' values to standard deviations using StandardScaler." },
            ].map((step, i) => (
              <div key={i} style={{ padding: 14, border: "1px solid var(--border-faint)", background: "rgba(191,0,255,0.02)" }}>
                <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: accentColor, marginBottom: 4 }}>{step.title}</h4>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-primary)", lineHeight: 1.4 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "recommend":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Selected Candidate Model Architectures</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Chose 4 high-performing candidate models optimized for structural tabular datasets:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { name: "XGBoost Classifier", param: "max_depth=5, lr=0.1, n_estimators=150", strength: "Captures non-linear tree intersections" },
              { name: "Random Forest", param: "n_estimators=100, max_features='sqrt'", strength: "Reduces variance via bootstrap aggregation" },
              { name: "Logistic Regression", param: "C=1.0, penalty='l2', solver='lbfgs'", strength: "Reliable, interpretable baseline" },
              { name: "SVM (Support Vector Machine)", param: "kernel='rbf', C=10.0, probability=True", strength: "Projects data into higher dimensional space" },
            ].map((m, i) => (
              <div key={i} style={{ border: "1px solid var(--border-faint)", padding: 14, background: "rgba(0,255,136,0.01)" }}>
                <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--green)", marginBottom: 4 }}>{m.name}</h4>
                <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Hyperparameters: {m.param}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-primary)" }}>Reason: {m.strength}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "train":
      return (
        <LiveTrainingSimulator accentColor={accentColor} />
      );

    case "evaluate":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Model Performance Benchmarking</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Evaluation matrix across five validation folds. Selected XGBoost as peak production model:
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--border-faint)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Fira Code, monospace", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-dim)", background: "rgba(255,255,255,0.02)" }}>
                  {["Model", "Accuracy", "F1 Score", "ROC-AUC", "Precision"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: accentColor, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["XGBoost (WINNER)", "83.4%", "0.81", "0.88", "0.84"],
                  ["Random Forest", "81.9%", "0.79", "0.86", "0.82"],
                  ["Logistic Regression", "79.6%", "0.76", "0.84", "0.78"],
                  ["SVM", "78.2%", "0.74", "0.82", "0.76"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-faint)", background: i === 0 ? "rgba(0,255,136,0.03)" : "none" }}>
                    {row.map((val, k) => (
                      <td key={k} style={{ padding: "10px 12px", color: i === 0 && k === 0 ? "var(--green)" : "var(--text-primary)" }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "shap":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Feature Influence (SHAP Attributions)</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Impact attribution of individual columns on prediction outcomes:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { name: "Sex (Female)", pct: 32, val: "+0.32", desc: "Highest overall positive indicator (women survived significantly more)", color: "var(--pink)" },
              { name: "Pclass (First Class)", pct: 21, val: "+0.21", desc: "Second highest indicator (first class passengers had priority)", color: "var(--purple)" },
              { name: "Age (Children)", pct: 18, val: "+0.18", desc: "Strong indicator for survival (under 12 age groups)", color: "var(--cyan)" },
              { name: "Fare (Higher Ticket Cost)", pct: 14, val: "+0.14", desc: "Subtle indicator (linked closely to Pclass status)", color: "var(--green)" },
            ].map((f, i) => (
              <div key={i} style={{ border: "1px solid var(--border-faint)", padding: 14, background: "rgba(255,0,102,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-bright)", fontWeight: 600 }}>{f.name}</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: f.color }}>{f.val} SHAP</span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{f.desc}</div>
                <div style={{ height: 6, background: "#050510", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${f.pct * 2}%`, background: f.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "viz":
      return (
        <div>
          <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>Generated Visualizations Overview</h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Plot files created, styled, and exported to user dashboard. Click to preview plots:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { name: "ROC-AUC Curve", type: "Evaluation" },
              { name: "Confusion Matrix", type: "Attribution" },
              { name: "SHAP Beeswarm", type: "Explainability" },
            ].map((chart, i) => (
              <div key={i} style={{ border: "1px solid var(--border-faint)", padding: 16, background: "#04040a", textAlign: "center", cursor: "pointer" }} className="cyber-card">
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-bright)", marginBottom: 4 }}>{chart.name}</h4>
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: accentColor, border: `1px solid ${accentColor}30`, padding: "1px 6px" }}>{chart.type}</span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <div>No inspect data available for this step.</div>;
  }
}

/* ======================================================
   TRAINING SIMULATOR FOR MODELS (WITH REAL-TIME CONSOLE)
   ====================================================== */
function LiveTrainingSimulator({ accentColor }: { accentColor: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeModelTab, setActiveModelTab] = useState<"xgboost" | "rf" | "logreg" | "svm">("xgboost");

  useEffect(() => {
    const mockLogs: Record<typeof activeModelTab, string[]> = {
      xgboost: [
        "[XGBoost] Loading dataset partitions...",
        "[XGBoost] Fitting Fold 1/5... CV Accuracy: 0.812",
        "[XGBoost] Fitting Fold 2/5... CV Accuracy: 0.824",
        "[XGBoost] Fitting Fold 3/5... CV Accuracy: 0.819",
        "[XGBoost] Fitting Fold 4/5... CV Accuracy: 0.841",
        "[XGBoost] Fitting Fold 5/5... CV Accuracy: 0.834",
        "[XGBoost] Training complete on all folds.",
        "[XGBoost] Optimal parameters found: max_depth=5, lr=0.1, n_estimators=150",
        "[XGBoost] Final Cross-Validation Accuracy: 83.4%",
      ],
      rf: [
        "[Random Forest] Initializing bootstrap aggregation trees...",
        "[Random Forest] Training 100 decision trees...",
        "[Random Forest] Fitting Fold 1/5... CV Accuracy: 0.801",
        "[Random Forest] Fitting Fold 2/5... CV Accuracy: 0.811",
        "[Random Forest] Fitting Fold 3/5... CV Accuracy: 0.820",
        "[Random Forest] Fitting Fold 4/5... CV Accuracy: 0.825",
        "[Random Forest] Fitting Fold 5/5... CV Accuracy: 0.819",
        "[Random Forest] Training complete.",
        "[Random Forest] Final Cross-Validation Accuracy: 81.9%",
      ],
      logreg: [
        "[Logistic Regression] Transforming classification matrix...",
        "[Logistic Regression] Minimizing cross-entropy loss function...",
        "[Logistic Regression] Optimizer converged successfully in 42 iterations.",
        "[Logistic Regression] Final Cross-Validation Accuracy: 79.6%",
      ],
      svm: [
        "[SVM] Initializing Support Vector Classifier...",
        "[SVM] Fitting non-linear Radial Basis Function (RBF) kernel...",
        "[SVM] Computing optimal hyperplanes and support vectors...",
        "[SVM] Final Cross-Validation Accuracy: 78.2%",
      ]
    };

    setLogs([]);
    const currentModelLogs = mockLogs[activeModelTab] || [];
    let i = 0;
    const logInterval = setInterval(() => {
      if (currentModelLogs && i < currentModelLogs.length) {
        setLogs((prev) => [...prev, currentModelLogs[i]]);
        i++;
      } else {
        clearInterval(logInterval);
      }
    }, 250);

    return () => clearInterval(logInterval);
  }, [activeModelTab]);

  return (
    <div>
      <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "var(--text-bright)", fontSize: 16, marginBottom: 12 }}>
        Real-Time Training Logs
      </h3>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
        Chose one of the candidate models below to inspect its detailed parallel cross-validation logs and convergence epochs:
      </p>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border-faint)", border: "1px solid var(--border-faint)", marginBottom: 16 }}>
        {[
          { id: "xgboost", name: "XGBoost", score: "83.4%" },
          { id: "rf", name: "RandForest", score: "81.9%" },
          { id: "logreg", name: "LogReg", score: "79.6%" },
          { id: "svm", name: "SVM", score: "78.2%" },
        ].map((tab) => (
          <div 
            key={tab.id}
            onClick={() => setActiveModelTab(tab.id as any)}
            style={{
              padding: "12px",
              background: activeModelTab === tab.id ? "rgba(255,255,255,0.03)" : "var(--bg-card)",
              borderBottom: activeModelTab === tab.id ? `2px solid ${accentColor}` : "2px solid transparent",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: activeModelTab === tab.id ? "var(--text-bright)" : "var(--text-muted)" }}>{tab.name}</div>
            <div style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: activeModelTab === tab.id ? accentColor : "var(--text-dim)", marginTop: 2 }}>{tab.score}</div>
          </div>
        ))}
      </div>

      {/* Real-Time Terminal Console */}
      <div style={{
        background: "#030308",
        border: "1px solid var(--border-dim)",
        borderRadius: 0,
        padding: "16px 20px",
        height: 220,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
      }}>
        {logs.map((log, idx) => (
          <div 
            key={idx} 
            style={{
              fontFamily: "Fira Code, monospace",
              fontSize: 12,
              color: log && (log.includes("Accuracy") || log.includes("complete")) ? "var(--green)" : "var(--text-primary)",
              lineHeight: 1.5,
              letterSpacing: "0.02em",
            }}
          >
            {log}
          </div>
        ))}
        {logs.length < 9 && (
          <div style={{
            fontFamily: "Fira Code, monospace",
            fontSize: 12,
            color: "var(--cyan)",
            opacity: 0.8,
          }} className="blink">
            ▋
          </div>
        )}
      </div>
    </div>
  );
}
