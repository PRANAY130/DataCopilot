"use client";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import StepTracker from "@/components/analysis/StepTracker";
import { useSession } from "@/context/SessionContext";
import { useAuthHeader } from "@/context/AuthContext";

const STEP_IDS = ["upload", "analyze", "task", "preprocess", "recommend", "train", "evaluate", "shap", "viz"];
const STEP_LABELS: Record<string, string> = {
  upload: "Dataset Ingest",
  analyze: "Data Profile",
  task: "Task Detection",
  preprocess: "Data Prep",
  recommend: "Model Selection",
  train: "Model Training",
  evaluate: "Evaluation",
  shap: "SHAP Explainability",
  viz: "Visualizations",
};
const STEP_DETAILS: Record<string, string> = {
  upload: "Parsing file structure and computing metrics",
  analyze: "Analyzing features and missing values",
  task: "Detecting ML task type and target column",
  preprocess: "Imputing, encoding, and scaling features",
  recommend: "Selecting optimal model candidates",
  train: "Running cross-validated model training",
  evaluate: "Computing accuracy, F1, AUC, confusion matrix",
  shap: "Computing feature attributions via SHAP",
  viz: "Generating correlation matrix and charts",
};

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> | any }) {
  const router = useRouter();
  const authHeader = useAuthHeader();
  const { session, startSession } = useSession();

  const sessionId = typeof params === "object" && !(params instanceof Promise)
    ? params.id
    : use(params as Promise<{ id: string }>).id;

  // Start the session (open WebSocket) when the page mounts
  useEffect(() => {
    if (sessionId) {
      startSession(sessionId, authHeader ? authHeader.replace("Bearer ", "") : null);
    }
  }, [sessionId]);

  const done = session?.status === "done";
  const steps = STEP_IDS.map(id => {
    const stepState = session?.steps[id];
    return {
      id,
      label: STEP_LABELS[id],
      status: stepState?.status || "pending" as const,
      detail: stepState?.status === "done"
        ? getDoneDetail(id, stepState.data)
        : STEP_DETAILS[id],
      duration: undefined,
    };
  });

  const completedCount = steps.filter(s => s.status === "done").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleStepSelect = (stepId: string) => {
    router.push(`/analysis/${sessionId}/${stepId}`);
  };

  const fileInfo = session?.steps?.upload?.data;

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// PIPELINE STATUS · session: {sessionId}</p>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "var(--text-bright)", marginBottom: 8 }}>
              {done ? "Analysis Complete" : "Running AutoML Pipeline"}
            </h1>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>
              {session?.filename || "Loading..."} · {session?.elapsed?.toFixed(1) || "0.0"}s elapsed
            </p>
          </div>
          {done && (
            <NeonButton href={`/results/${sessionId}`} variant="solid-cyan" size="lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              View Finished Results
            </NeonButton>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--bg-panel)", marginBottom: 32, border: "1px solid var(--border-faint)" }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: "width 0.5s ease" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* LEFT: Step Tracker */}
          <StepTracker steps={steps} onStepSelect={handleStepSelect} />

          {/* RIGHT: File Info + Hint */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fileInfo && (
              <div style={{ border: "1px solid var(--border-faint)", background: "var(--bg-card)", padding: "20px 24px" }}>
                <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>// FILE INFORMATION</p>
                {[
                  { label: "Filename", value: fileInfo.filename },
                  { label: "Total Rows", value: fileInfo.rows?.toLocaleString() },
                  { label: "Features", value: fileInfo.cols },
                  { label: "Target column", value: session?.steps?.task?.data?.target_col || "Detecting..." },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-faint)", paddingBottom: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)" }}>{r.label}</span>
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-bright)" }}>{r.value ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(0,245,255,0.02)", padding: "16px 20px" }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--amber)", marginBottom: 8 }}>💡 Click Any Step to Inspect</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Click any completed or active step to navigate to its dedicated detail page with real computed data, logs, and charts.
              </p>
            </div>

            {!session?.connected && session?.status === "running" && (
              <div style={{ border: "1px solid rgba(255,187,0,0.2)", background: "rgba(255,187,0,0.03)", padding: "12px 16px" }}>
                <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--amber)" }}>
                  ⚠ Connecting to backend...
                  <br />Make sure FastAPI is running at localhost:8000
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function getDoneDetail(stepId: string, data: any): string {
  if (!data) return "Completed";
  switch (stepId) {
    case "upload": return `Loaded ${data.filename} · ${data.rows} rows`;
    case "analyze": return `Profiled ${data.per_column?.length} columns · ${data.duplicate_rows} duplicates`;
    case "task": return `${data.task_type} · Target: ${data.target_col}`;
    case "preprocess": return `${data.transforms?.length} transforms · ${data.shape_after?.cols} features`;
    case "recommend": return `${data.models?.length} models selected`;
    case "train": return `Cross-validation complete`;
    case "evaluate": return `Best: ${data.best_model}`;
    case "shap": return `${data.features?.length} features ranked`;
    case "viz": return `Charts and correlation matrix ready`;
    default: return "Completed";
  }
}
