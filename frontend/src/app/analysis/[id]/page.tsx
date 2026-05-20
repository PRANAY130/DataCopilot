"use client";
import { useEffect, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import StepTracker from "@/components/analysis/StepTracker";
import { useSession } from "@/context/SessionContext";
import { useAuthHeader } from "@/context/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
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
  const searchParams = useSearchParams();
  const authHeader = useAuthHeader();
  const { session, startSession, loadSessionFromApi, resumePipeline } = useSession();
  const [checkingApi, setCheckingApi] = useState(true);

  const sessionId = typeof params === "object" && !(params instanceof Promise)
    ? params.id
    : use(params as Promise<{ id: string }>).id;

  const mode = searchParams.get("mode") || "auto";

  // Smart loader: check if session is already done → load from API (Firestore)
  // Otherwise open a WebSocket for live streaming
  useEffect(() => {
    if (!sessionId) return;

    // Already loaded this session → do nothing
    if (session?.sessionId === sessionId) {
      setCheckingApi(false);
      return;
    }

    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;

    // Check the API first — if session exists and is done, load from Firestore
    fetch(`${BACKEND_URL}/api/session/${sessionId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.status === "done") {
          // Completed session → restore from Firestore, no WebSocket needed
          loadSessionFromApi(sessionId, token);
        } else {
          // New or still-running session → open WebSocket
          startSession(sessionId, token, mode);
        }
      })
      .catch(() => {
        // Network error → fallback to WebSocket
        startSession(sessionId, token, mode);
      })
      .finally(() => setCheckingApi(false));
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
  const pausedStepId = STEP_IDS.find(id => session?.steps[id]?.status === "paused");
  const pausedStep = pausedStepId ? session?.steps[pausedStepId] : null;

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />

      {/* Loading state while we check the API */}
      {checkingApi && !session && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh", flexDirection:"column", gap:16 }}>
          <div className="pulse-dot" style={{ backgroundColor:"var(--cyan)", width:10, height:10 }} />
          <p style={{ fontFamily:"Fira Code, monospace", fontSize:12, color:"var(--cyan)", letterSpacing:"0.15em" }}>
            // LOADING SESSION {sessionId}...
          </p>
        </div>
      )}

      {/* Main content — shown once session state is available */}
      {!checkingApi || session ? (
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

          {/* RIGHT: Action Config Panel / File Info + Hint */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pausedStep ? (
              <PausedConfigPanel
                key={pausedStepId}
                stepId={pausedStepId!}
                data={pausedStep.data}
                resumePipeline={resumePipeline}
              />
            ) : fileInfo ? (
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
            ) : null}

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
      ) : null}
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

interface PausedConfigPanelProps {
  stepId: string;
  data: any;
  resumePipeline: (stepId: string, config: Record<string, any>) => void;
}

function PausedConfigPanel({ stepId, data, resumePipeline }: PausedConfigPanelProps) {
  const [submitting, setSubmitting] = useState(false);

  // States for Task step
  const [targetCol, setTargetCol] = useState(data.target_col || "none");
  const [taskType, setTaskType] = useState(data.task_type || "Binary Classification");
  const [timeCol, setTimeCol] = useState(data.time_col || "none");
  const [droppedCols, setDroppedCols] = useState<string[]>([]);

  // States for Preprocess step
  const [imputation, setImputation] = useState("median");
  const [scaling, setScaling] = useState("standard");

  // States for Recommend step
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [modelParams, setModelParams] = useState<Record<string, Record<string, any>>>({});

  // Sync initial data
  useEffect(() => {
    if (stepId === "task") {
      setTargetCol(data.target_col || "none");
      setTaskType(data.task_type || "Binary Classification");
      setTimeCol(data.time_col || "none");
      setDroppedCols([]);
    } else if (stepId === "preprocess") {
      setImputation("median");
      setScaling("standard");
    } else if (stepId === "recommend" && data.models) {
      setEnabledModels(data.models.map((m: any) => m.id));
      const params: Record<string, Record<string, any>> = {};
      data.models.forEach((m: any) => {
        if (m.params) {
          params[m.id] = { ...m.params };
        }
      });
      setModelParams(params);
    }
  }, [stepId, data]);

  const handleConfirm = () => {
    setSubmitting(true);
    let payload: Record<string, any> = {};

    if (stepId === "task") {
      payload = {
        target_col: targetCol === "none" ? null : targetCol,
        task_type: taskType,
        time_col: timeCol === "none" ? null : timeCol,
        dropped_cols: droppedCols,
      };
    } else if (stepId === "preprocess") {
      payload = {
        imputation_strategy: imputation,
        scaling_strategy: scaling,
      };
    } else if (stepId === "recommend") {
      payload = {
        enabled_model_ids: enabledModels,
        model_params: modelParams,
      };
    }

    resumePipeline(stepId, payload);
  };

  const handleParamChange = (modelId: string, paramName: string, value: any) => {
    setModelParams(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [paramName]: value
      }
    }));
  };

  const renderContent = () => {
    if (stepId === "task") {
      const columns = data.columns || [];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Target Column</label>
            <select
              value={targetCol || "none"}
              onChange={(e) => setTargetCol(e.target.value)}
              style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,245,255,0.25)", color: "white", padding: 8, fontFamily: "Rajdhani, sans-serif", fontSize: 14 }}
            >
              <option value="none">No Target (Clustering)</option>
              {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Task Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,245,255,0.25)", color: "white", padding: 8, fontFamily: "Rajdhani, sans-serif", fontSize: 14 }}
            >
              <option value="Binary Classification">Binary Classification</option>
              <option value="Multi-class Classification">Multi-class Classification</option>
              <option value="Regression">Regression</option>
              <option value="Clustering">Clustering</option>
              <option value="Time Series">Time Series</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Time/Date Column</label>
            <select
              value={timeCol || "none"}
              onChange={(e) => setTimeCol(e.target.value)}
              style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,245,255,0.25)", color: "white", padding: 8, fontFamily: "Rajdhani, sans-serif", fontSize: 14 }}
            >
              <option value="none">None</option>
              {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Select Columns to Drop</label>
            <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid var(--border-faint)", padding: 8, background: "rgba(0,0,0,0.3)" }}>
              {columns.filter((c: string) => c !== targetCol).map((c: string) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0", cursor: "pointer", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-bright)" }}>
                  <input
                    type="checkbox"
                    checked={droppedCols.includes(c)}
                    onChange={(e) => {
                      if (e.target.checked) setDroppedCols([...droppedCols, c]);
                      else setDroppedCols(droppedCols.filter(x => x !== c));
                    }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (stepId === "preprocess") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Imputation Strategy</label>
            <select
              value={imputation}
              onChange={(e) => setImputation(e.target.value)}
              style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,245,255,0.25)", color: "white", padding: 8, fontFamily: "Rajdhani, sans-serif", fontSize: 14 }}
            >
              <option value="median">Median (Recommended)</option>
              <option value="mean">Mean</option>
              <option value="mode">Most Frequent (Mode)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Scaling Strategy</label>
            <select
              value={scaling}
              onChange={(e) => setScaling(e.target.value)}
              style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,245,255,0.25)", color: "white", padding: 8, fontFamily: "Rajdhani, sans-serif", fontSize: 14 }}
            >
              <option value="standard">StandardScaler (Zero mean, unit variance)</option>
              <option value="minmax">MinMaxScaler ([0, 1] range)</option>
              <option value="none">No Scaling</option>
            </select>
          </div>

          {data.detected_id_cols && data.detected_id_cols.length > 0 && (
            <div style={{ border: "1px dashed rgba(0,245,255,0.2)", padding: "10px 12px", background: "rgba(0,245,255,0.01)" }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--cyan)", textTransform: "uppercase", marginBottom: 4 }}>// AUTO ID DROPPING ACTIVE</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                The system automatically flagged the following ID/index columns to drop: <strong style={{ color: "var(--cyan)" }}>{data.detected_id_cols.join(", ")}</strong>.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (stepId === "recommend") {
      const models = data.models || [];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", marginBottom: 6 }}>Enabled Models</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {models.map((m: any) => (
                <div key={m.id} style={{ border: "1px solid var(--border-faint)", padding: 10, background: "rgba(0,0,0,0.2)" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-bright)" }}>
                    <input
                      type="checkbox"
                      checked={enabledModels.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) setEnabledModels([...enabledModels, m.id]);
                        else setEnabledModels(enabledModels.filter(x => x !== m.id));
                      }}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      {m.name}
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {m.reason}
                      </div>
                    </div>
                  </label>

                  {/* Render Hyperparameter adjustments if enabled */}
                  {enabledModels.includes(m.id) && m.params && Object.keys(m.params).length > 0 && (
                    <div style={{ marginTop: 8, borderTop: "1px dashed var(--border-faint)", paddingTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {Object.entries(m.params).map(([paramName, paramVal]: [string, any]) => (
                        <div key={paramName}>
                          <label style={{ display: "block", fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--cyan)", marginBottom: 3 }}>{paramName}</label>
                          <input
                            type="text"
                            value={modelParams[m.id]?.[paramName] ?? paramVal}
                            onChange={(e) => handleParamChange(m.id, paramName, e.target.value)}
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,245,255,0.2)", color: "white", padding: "3px 6px", fontFamily: "Fira Code, monospace", fontSize: 11 }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const STEP_TITLES: Record<string, string> = {
    task: "Configure ML Task",
    preprocess: "Configure Preprocessing",
    recommend: "Select Model Candidates",
  };

  return (
    <div style={{ border: "1px solid var(--cyan)", background: "rgba(4,4,18,0.95)", padding: "20px 24px", boxShadow: "0 0 25px rgba(0,245,255,0.15)", position: "relative" }}>
      {/* Corner accents */}
      <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: "2px solid var(--cyan)", borderLeft: "2px solid var(--cyan)" }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: "2px solid var(--cyan)", borderRight: "2px solid var(--cyan)" }} />

      <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>// STEP ACTION REQUIRED</p>
      <h3 style={{ fontFamily: "Orbitron, sans-serif", fontSize: 18, color: "var(--text-bright)", marginBottom: 16 }}>{STEP_TITLES[stepId] || "Pipeline Action Required"}</h3>

      {renderContent()}

      <div style={{ marginTop: 20, borderTop: "1px solid var(--border-faint)", paddingTop: 16 }}>
        <button
          onClick={handleConfirm}
          disabled={submitting || (stepId === "recommend" && enabledModels.length === 0)}
          style={{
            width: "100%",
            background: "var(--cyan)",
            color: "black",
            border: "none",
            padding: "10px 16px",
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 800,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(0,245,255,0.35)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={e => {
            if (!(submitting || (stepId === "recommend" && enabledModels.length === 0))) {
              e.currentTarget.style.boxShadow = "0 0 25px rgba(0,245,255,0.6)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = "0 0 15px rgba(0,245,255,0.35)";
            e.currentTarget.style.transform = "none";
          }}
        >
          {submitting ? "Processing Request..." : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={16} height={16}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Confirm & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
}
