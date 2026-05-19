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

const getStepIndexFromElapsed = (elapsedVal: number): number => {
  let cumulative = 0.6; // initial start delay
  for (let i = 0; i < STEPS_SEQUENCE.length; i++) {
    cumulative += STEPS_SEQUENCE[i].duration;
    if (elapsedVal < cumulative) {
      return i;
    }
  }
  return STEPS_SEQUENCE.length;
};

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> | any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setSessionId(p.id));
    } else if (params && typeof params === "object" && params.id) {
      setSessionId(params.id);
    } else {
      setSessionId("demo");
    }
  }, [params]);

  // Set initial elapsed time from query param if present
  useEffect(() => {
    const elapsedQuery = searchParams.get("elapsed");
    if (elapsedQuery) {
      const parsed = parseFloat(elapsedQuery);
      setElapsed(parsed);
      if (parsed >= 15.5) {
        setDone(true);
      }
    }
  }, [searchParams]);

  const currentStep = getStepIndexFromElapsed(elapsed);

  const steps = STEPS_SEQUENCE.map((s, i) => ({
    ...s,
    status: (i < currentStep ? "done" : i === currentStep ? "running" : "pending") as StepStatus,
  }));

  // Auto-run timer (never pauses now)
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.1;
        if (next >= 15.5) {
          setDone(true);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [done]);

  const progress = done ? 100 : Math.min(((currentStep + 1) / STEPS_SEQUENCE.length) * 100, 99);

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ paddingTop: 100, maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px" }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <p className="section-eyebrow" style={{ color: "var(--cyan)", marginBottom: 0 }}>// PIPELINE STATUS</p>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)" }}>· session: {sessionId}</span>
            </div>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "var(--text-bright)", marginBottom: 6 }}>
              {done ? "Analysis Complete" : "Pipeline Processing"}
            </h1>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>
              Elapsed Time: {elapsed.toFixed(1)}s
            </p>
          </div>

          {done && (
            <NeonButton href={`/results/${sessionId}`} variant="solid-cyan" size="lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              View Finished Results
            </NeonButton>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--bg-panel)", marginBottom: 32, border: "1px solid var(--border-faint)" }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Layout split: Steps Left, In-Place Dynamic Info Panel Right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
          <div>
            <StepTracker 
              steps={steps} 
              selectedStepId={undefined}
              onStepSelect={(id) => {
                router.push(`/analysis/${sessionId}/${id}?elapsed=${elapsed.toFixed(1)}`);
              }}
            />
          </div>

          {/* Quick-Info Side Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick stats */}
            <div style={{ border: "1px solid var(--border-faint)", background: "var(--bg-card)", padding: "20px" }}>
              <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--cyan)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                // File Information
              </h4>
              {[
                { label: "Filename", value: "titanic.csv" },
                { label: "Total Rows", value: "891" },
                { label: "Features", value: "12" },
                { label: "Target column", value: "Survived" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid var(--border-faint)" }}>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)" }}>{row.label}</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-primary)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Quick guide */}
            <div style={{ border: "1px solid var(--border-dim)", background: "rgba(0, 245, 255, 0.02)", padding: "20px" }}>
              <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-bright)", letterSpacing: "0.05em", marginBottom: 8 }}>
                💡 Click Any Step to Inspect
              </h4>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                The pipeline runs automatically in the background. Click on any completed or active step to navigate to its dedicated detail page containing detailed previews, benchmark statistics, and live candidate training logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
