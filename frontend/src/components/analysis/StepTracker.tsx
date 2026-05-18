"use client";
import { useEffect, useState } from "react";

interface Step {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  duration?: number;
}

const MOCK_STEPS: Step[] = [
  { id: "upload", label: "Receiving dataset", status: "done", detail: "titanic.csv · 1.2 MB · 891 rows", duration: 0.3 },
  { id: "analyze", label: "Analyzing dataset structure", status: "done", detail: "12 features detected · 3 categorical · 2 datetime", duration: 1.1 },
  { id: "task", label: "Detecting ML task type", status: "done", detail: "Classification detected (binary target: 'Survived')", duration: 0.8 },
  { id: "preprocess", label: "Building preprocessing pipeline", status: "running", detail: "Imputing Age (median) · Encoding Sex, Embarked · Scaling fare..." },
  { id: "recommend", label: "Recommending models", status: "pending" },
  { id: "train", label: "Training candidate models", status: "pending" },
  { id: "evaluate", label: "Evaluating & comparing models", status: "pending" },
  { id: "shap", label: "Computing SHAP explanations", status: "pending" },
  { id: "viz", label: "Generating visualizations", status: "pending" },
];

const STATUS_COLORS: Record<Step["status"], string> = {
  pending: "var(--text-dim)",
  running: "var(--cyan)",
  done: "var(--green)",
  error: "var(--pink)",
};

const STATUS_ICON: Record<Step["status"], React.ReactNode> = {
  pending: <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)" }}>○</span>,
  running: <span className="pulse-dot" style={{ backgroundColor: "var(--cyan)", width: 8, height: 8 }} />,
  done: (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5} width={14} height={14}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  error: <span style={{ color: "var(--pink)", fontSize: 14 }}>✕</span>,
};

export default function StepTracker({ steps = MOCK_STEPS }: { steps?: Step[] }) {
  return (
    <div className="terminal" style={{ borderRadius: 0 }}>
      {/* Terminal header */}
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: "#ff5f56" }} />
        <div className="terminal-dot" style={{ background: "#ffbd2e" }} />
        <div className="terminal-dot" style={{ background: "#27c93f" }} />
        <span style={{ marginLeft: 8, fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          datacopilot · analysis pipeline
        </span>
      </div>

      {/* Steps */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((step, i) => (
          <div key={step.id} className="step-item" style={{ display: "flex", alignItems: "flex-start", gap: 14, opacity: step.status === "pending" ? 0.35 : 1, transition: "opacity 0.4s" }}>
            {/* Status icon */}
            <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {STATUS_ICON[step.status]}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "Fira Code, monospace",
                    fontSize: 13,
                    color: STATUS_COLORS[step.status],
                    letterSpacing: "0.03em",
                  }}
                >
                  {step.label}
                  {step.status === "running" && <span className="blink" style={{ color: "var(--cyan)", marginLeft: 4 }}>_</span>}
                </span>
                {step.duration && (
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)", marginLeft: "auto" }}>
                    {step.duration}s
                  </span>
                )}
              </div>
              {step.detail && (
                <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.5 }}>
                  → {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
