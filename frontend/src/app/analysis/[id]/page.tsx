"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StepTracker from "@/components/analysis/StepTracker";
import NeonButton from "@/components/ui/NeonButton";
import { useRouter } from "next/navigation";

const STEPS_SEQUENCE = [
  { id: "upload", label: "Receiving dataset", detail: "titanic.csv · 1.2 MB · 891 rows", duration: 0.3 },
  { id: "analyze", label: "Analyzing dataset structure", detail: "12 features · 3 categorical · 2 datetime · 177 nulls in Age", duration: 1.1 },
  { id: "task", label: "Detecting ML task type", detail: "Classification detected (binary target: 'Survived')", duration: 0.8 },
  { id: "preprocess", label: "Building preprocessing pipeline", detail: "Imputing Age (median) · Encoding Sex, Embarked · StandardScaler", duration: 2.3 },
  { id: "recommend", label: "Recommending models via Gemini", detail: "XGBoost, Random Forest, Logistic Regression, SVM selected", duration: 1.0 },
  { id: "train", label: "Training candidate models", detail: "4 models × 5-fold CV — XGBoost: 83.4% · RF: 81.9% · LR: 79.6%", duration: 4.2 },
  { id: "evaluate", label: "Evaluating & comparing models", detail: "Best: XGBoost — F1: 0.81 · ROC-AUC: 0.88 · Precision: 0.84", duration: 1.5 },
  { id: "shap", label: "Computing SHAP explanations", detail: "Top feature: Sex (0.32) · Pclass (0.21) · Age (0.18)", duration: 2.1 },
  { id: "viz", label: "Generating visualizations", detail: "ROC curve · confusion matrix · feature importance · correlation heatmap", duration: 1.0 },
];

type StepStatus = "pending" | "running" | "done" | "error";

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const steps = STEPS_SEQUENCE.map((s, i) => ({
    ...s,
    status: (i < currentStep ? "done" : i === currentStep ? "running" : "pending") as StepStatus,
  }));

  // Timer
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(timer);
  }, [done]);

  // Auto-advance steps
  useEffect(() => {
    if (currentStep >= STEPS_SEQUENCE.length) {
      setDone(true);
      return;
    }
    const step = STEPS_SEQUENCE[currentStep];
    const delay = step ? (step.duration ?? 1) * 1000 : 800;
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    const startDelay = setTimeout(() => setCurrentStep(0), 600);
    return () => clearTimeout(startDelay);
  }, []);

  const progress = done ? 100 : Math.min(((currentStep + 1) / STEPS_SEQUENCE.length) * 100, 99);

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ paddingTop: 100, maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        
        {/* LEFT: Terminal + Steps */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <p className="section-eyebrow" style={{ color: "var(--cyan)", marginBottom: 0 }}>// ANALYSIS PIPELINE</p>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)" }}>· session: {params.id}</span>
            </div>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "var(--text-bright)", marginBottom: 6 }}>
              {done ? "Analysis Complete" : "Running Analysis"}
            </h1>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>
              {done ? `Completed in ${elapsed.toFixed(1)}s` : `Elapsed: ${elapsed.toFixed(1)}s`}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--bg-panel)", marginBottom: 24, border: "1px solid var(--border-faint)" }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Step tracker */}
          <StepTracker steps={steps} />

          {/* Done CTA */}
          {done && (
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <NeonButton href={`/results/${params.id}`} variant="solid-cyan" size="lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
                View Results
              </NeonButton>
              <NeonButton href={`/chat/${params.id}`} variant="cyan" size="lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                Chat with AI
              </NeonButton>
            </div>
          )}
        </div>

        {/* RIGHT: Dataset info panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>
          {/* Dataset summary */}
          <div style={{ border: "1px solid var(--border-faint)", background: "var(--bg-card)", padding: "24px" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 16 }}>// Dataset Summary</p>
            {[
              { label: "File", value: "titanic.csv" },
              { label: "Rows", value: "891" },
              { label: "Columns", value: "12" },
              { label: "Task", value: "Classification" },
              { label: "Target", value: "Survived" },
              { label: "Missing", value: "177 values" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--border-faint)" }}>
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)" }}>{row.label}</span>
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-primary)" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* AI Reasoning panel */}
          <div style={{ border: "1px solid rgba(191,0,255,0.2)", background: "rgba(191,0,255,0.03)", padding: "20px" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--purple)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>// AI Reasoning</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
              {currentStep < 2 ? "Analyzing dataset structure..." : currentStep < 4 ? "XGBoost selected: dataset has mixed feature types and non-linear patterns. Gradient boosting handles this well." : "Preprocessing: Age imputed with median to handle skew. SMOTE not needed — class balance is acceptable (61/38)."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
