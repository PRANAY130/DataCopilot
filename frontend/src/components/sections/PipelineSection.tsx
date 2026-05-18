"use client";
import { useRef } from "react";
import ParallaxLayer from "@/components/ui/ParallaxLayer";

const STEPS = [
  { num: "01", title: "Upload Dataset", desc: "Drop any CSV or JSON. The system immediately begins parsing structure, detecting column types, and computing quality metrics.", color: "var(--cyan)", icon: "📂" },
  { num: "02", title: "AI Analysis & Task Detection", desc: "Gemini & Groq analyze your dataset metadata and determine the optimal ML task type — classification, regression, clustering, or time-series.", color: "var(--purple)", icon: "🧠" },
  { num: "03", title: "Intelligent Preprocessing", desc: "Missing values imputed, categoricals encoded, features scaled, imbalanced classes balanced with SMOTE — all automatically.", color: "var(--pink)", icon: "⚙️" },
  { num: "04", title: "Multi-Model Training", desc: "Multiple models trained in parallel: XGBoost, Random Forest, Logistic Regression, SVMs. Evaluated with Accuracy, F1, ROC-AUC.", color: "var(--amber)", icon: "🏋️" },
  { num: "05", title: "Explainability & Visualization", desc: "SHAP feature importance, confusion matrices, ROC curves, and interactive Plotly charts generated automatically.", color: "var(--green)", icon: "📊" },
  { num: "06", title: "Conversational Insights", desc: "Chat with the AI about your data. Ask 'Why is precision low?' or 'How can I improve?' Get actionable expert-level recommendations.", color: "var(--cyan)", icon: "💬" },
];

export default function PipelineSection() {
  return (
    <section id="pipeline" style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      {/* Background orb via parallax */}
      <ParallaxLayer speed={0.2} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div className="orb" style={{ width: 700, height: 700, background: "rgba(0,245,255,0.04)", top: "20%", right: "-20%", animationDelay: "-5s" }} />
      </ParallaxLayer>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <p className="section-eyebrow" style={{ color: "var(--pink)" }}>// WORKFLOW PIPELINE</p>
          <h2 className="section-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-bright)", marginBottom: 16 }}>
            From Upload to Insight in{" "}
            <span className="shimmer-cyan">Seconds</span>
          </h2>
        </div>

        {/* Steps */}
        <div style={{ position: "relative" }}>
          {/* Vertical connector */}
          <div
            style={{
              position: "absolute",
              left: 43,
              top: 24,
              bottom: 24,
              width: 1,
              background: "linear-gradient(to bottom, transparent, var(--border-dim) 10%, var(--border-dim) 90%, transparent)",
              zIndex: 0,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="cyber-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "88px 1fr",
                  gap: 0,
                  padding: 0,
                  overflow: "hidden",
                  background: "var(--bg-card)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Step number block */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px 0",
                    background: `${step.color}08`,
                    borderRight: `1px solid ${step.color}20`,
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{step.icon}</span>
                  <span
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: step.color,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: "24px 28px" }}>
                  <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--text-bright)", marginBottom: 6, letterSpacing: "0.03em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </div>

                {/* Side accent */}
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: 2,
                    background: step.color,
                    boxShadow: `0 0 12px ${step.color}`,
                    opacity: 0.6,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
