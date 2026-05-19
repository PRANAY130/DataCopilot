"use client";
import { useRef } from "react";
import ParallaxLayer from "@/components/ui/ParallaxLayer";

const STEPS = [
  { 
    num: "01", 
    title: "Upload Dataset", 
    desc: "Drop any CSV or JSON. The system immediately begins parsing structure, detecting column types, and computing quality metrics.", 
    color: "var(--cyan)", 
    icon: "📂",
    tech: "FILE_STREAM // CONNECTED",
    stat: "INGEST_SPEED: 45MB/s",
    metrics: ["Schema Parser", "Null Detector", "Type Inference"]
  },
  { 
    num: "02", 
    title: "AI Analysis & Task Detection", 
    desc: "Gemini & Groq analyze your dataset metadata and determine the optimal ML task type — classification, regression, clustering, or time-series.", 
    color: "var(--purple)", 
    icon: "🧠",
    tech: "LLM_CORES // ONLINE",
    stat: "TOKENS: 4,200/s",
    metrics: ["Gemini 1.5 Pro", "Task Classifier", "Target Audit"]
  },
  { 
    num: "03", 
    title: "Intelligent Preprocessing", 
    desc: "Missing values imputed, categoricals encoded, features scaled, imbalanced classes balanced with SMOTE — all automatically.", 
    color: "var(--pink)", 
    icon: "⚙️",
    tech: "COMPUTE_SHAPER // ENGAGED",
    stat: "SPARSITY: 0.12",
    metrics: ["SMOTE Resampling", "K-NN Imputation", "RobustScaler"]
  },
  { 
    num: "04", 
    title: "Multi-Model Training", 
    desc: "Multiple models trained in parallel: XGBoost, Random Forest, Logistic Regression, SVMs. Evaluated with Accuracy, F1, ROC-AUC.", 
    color: "var(--amber)", 
    icon: "🏋️",
    tech: "TRAIN_GRID // ACTIVE",
    stat: "GPU_CORES: 128",
    metrics: ["5-Fold GridCV", "Parallel Hyperopt", "Loss Profiler"]
  },
  { 
    num: "05", 
    title: "Explainability & Visualization", 
    desc: "SHAP feature importance, confusion matrices, ROC curves, and interactive Plotly charts generated automatically.", 
    color: "var(--green)", 
    icon: "📊",
    tech: "SHAP_DAEMON // PLOTTING",
    stat: "SAMPLES: 1,500",
    metrics: ["TreeSHAP Kernel", "ROC Curve Engine", "Correlation Heatmap"]
  },
  { 
    num: "06", 
    title: "Conversational Insights", 
    desc: "Chat with the AI about your data. Ask 'Why is precision low?' or 'How can I improve?' Get actionable expert-level recommendations.", 
    color: "var(--cyan)", 
    icon: "💬",
    tech: "CHAT_CORES // ACTIVE",
    stat: "LATENCY: 8ms",
    metrics: ["Expert Reasoning", "Actionable Plan", "SQL Agent"]
  },
];

export default function PipelineSection() {
  return (
    <section id="pipeline" style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: "rgba(0,245,255,0.015)", top: "10%", left: "-10%", pointerEvents: "none", zIndex: 0 }} />
      <div className="orb" style={{ width: 600, height: 600, background: "rgba(255,0,128,0.015)", bottom: "10%", right: "-10%", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 90 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ height: 1, width: 24, background: "var(--cyan)" }} />
            <p className="section-eyebrow" style={{ color: "var(--cyan)", margin: 0, textTransform: "uppercase", letterSpacing: "0.15em" }}>// WORKFLOW PIPELINE</p>
            <span style={{ height: 1, width: 24, background: "var(--cyan)" }} />
          </div>
          <h2 className="section-title" style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-bright)", marginBottom: 16 }}>
            Automated From Upload to <span className="shimmer-cyan">Production</span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-muted)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            A fully unified model generation pipeline that cleans, fits, compares, and explains your data in real-time.
          </p>
        </div>

        {/* CSS for custom styled timeline */}
        <style>{`
          .pipeline-timeline {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 60px;
          }
          .pipeline-line {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, 
              rgba(0, 245, 255, 0) 0%, 
              rgba(0, 245, 255, 0.4) 10%, 
              rgba(255, 0, 102, 0.4) 50%, 
              rgba(0, 245, 255, 0.4) 90%, 
              rgba(0, 245, 255, 0) 100%
            );
            transform: translateX(-50%);
            z-index: 0;
          }
          .pipeline-line-pulse {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, transparent, var(--cyan), transparent);
            transform: translateX(-50%);
            z-index: 0;
            opacity: 0.8;
            animation: flowDown 8s linear infinite;
            background-size: 100% 200px;
          }
          @keyframes flowDown {
            0% { background-position: 0 -200px; }
            100% { background-position: 0 1000px; }
          }
          .pipeline-card-wrapper {
            display: flex;
            justify-content: flex-start;
            width: 100%;
            position: relative;
            z-index: 1;
          }
          .pipeline-card-wrapper.right {
            justify-content: flex-end;
          }
          .pipeline-card {
            width: 44%;
            background: rgba(6, 6, 12, 0.7);
            border: 1px solid var(--border-faint);
            padding: 28px 32px;
            position: relative;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(20px);
            box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
          }
          .pipeline-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.03) 0%, transparent 50%);
            pointer-events: none;
            transition: opacity 0.3s;
          }
          .pipeline-card:hover {
            transform: translateY(-8px);
            border-color: var(--accent);
            box-shadow: 
              0 15px 35px rgba(0, 0, 0, 0.6), 
              0 0 25px rgba(var(--accent-rgb), 0.25),
              inset 0 0 12px rgba(var(--accent-rgb), 0.1);
          }
          .pipeline-card:hover .step-icon {
            transform: scale(1.2) rotate(8deg);
          }
          .pipeline-node {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: var(--bg-void);
            border: 2px solid var(--border-dim);
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 0 10px rgba(0,0,0,0.8);
          }
          .pipeline-node-glow {
            position: absolute;
            inset: -2px;
            border-radius: 50%;
            background: transparent;
            border: 2px solid var(--accent);
            opacity: 0;
            transition: opacity 0.4s, transform 0.4s;
          }
          .pipeline-card-wrapper:hover .pipeline-node {
            border-color: var(--accent);
            transform: translate(-50%, -50%) scale(1.1);
          }
          .pipeline-card-wrapper:hover .pipeline-node-glow {
            opacity: 1;
            transform: scale(1.25);
            animation: pulseGlow 1.8s infinite;
          }
          @keyframes pulseGlow {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          
          /* Corner brackets */
          .card-bracket {
            position: absolute;
            width: 12px;
            height: 12px;
            transition: all 0.3s;
          }
          .card-bracket-tl { top: -1px; left: -1px; border-top: 2px solid var(--border-dim); border-left: 2px solid var(--border-dim); }
          .card-bracket-br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--border-dim); border-right: 2px solid var(--border-dim); }
          
          .pipeline-card:hover .card-bracket-tl {
            border-top-color: var(--accent);
            border-left-color: var(--accent);
            width: 18px;
            height: 18px;
          }
          .pipeline-card:hover .card-bracket-br {
            border-bottom-color: var(--accent);
            border-right-color: var(--accent);
            width: 18px;
            height: 18px;
          }

          /* Tech Stats Layout */
          .tech-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed var(--border-faint);
            opacity: 0.6;
            transition: opacity 0.3s;
          }
          .pipeline-card:hover .tech-stats-grid {
            opacity: 1;
            border-top-style: solid;
            border-top-color: rgba(var(--accent-rgb), 0.2);
          }
          .tech-stat-pill {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-faint);
            padding: 4px 6px;
            text-align: center;
            font-family: "Fira Code", monospace;
            font-size: 9px;
            color: var(--text-muted);
            transition: all 0.3s;
          }
          .pipeline-card:hover .tech-stat-pill {
            border-color: rgba(var(--accent-rgb), 0.3);
            color: var(--text-bright);
            background: rgba(var(--accent-rgb), 0.05);
          }

          @media (max-width: 900px) {
            .pipeline-line, .pipeline-line-pulse {
              left: 20px;
              transform: none;
            }
            .pipeline-card-wrapper, .pipeline-card-wrapper.right {
              justify-content: flex-end;
            }
            .pipeline-card {
              width: calc(100% - 50px);
            }
            .pipeline-node {
              left: 20px;
              transform: translate(-50%, -50%);
            }
            .pipeline-card-wrapper:hover .pipeline-node {
              transform: translate(-50%, -50%) scale(1.05);
            }
          }
        `}</style>

        {/* Timeline body */}
        <div className="pipeline-timeline">
          <div className="pipeline-line" />
          <div className="pipeline-line-pulse" />

          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0;
            const accentVar = step.color;
            const accentRgb = accentVar.includes("cyan") ? "0, 245, 255" :
                              accentVar.includes("purple") ? "191, 0, 255" :
                              accentVar.includes("pink") ? "255, 0, 102" :
                              accentVar.includes("amber") ? "255, 187, 0" :
                              accentVar.includes("green") ? "0, 255, 136" : "0, 245, 255";

            return (
              <div 
                key={step.num} 
                className={`pipeline-card-wrapper ${isEven ? "left" : "right"}`}
                style={{ 
                  "--accent": accentVar,
                  "--accent-rgb": accentRgb
                } as any}
              >
                {/* Central animated connecting node */}
                <div className="pipeline-node" style={{ color: accentVar }}>
                  <div className="pipeline-node-glow" />
                  <span style={{ fontSize: 16, zIndex: 1 }}>{step.icon}</span>
                </div>

                {/* Cyber Card Content */}
                <div className="pipeline-card">
                  {/* Corner bracket styling */}
                  <div className="card-bracket card-bracket-tl" />
                  <div className="card-bracket card-bracket-br" />

                  {/* Top glowing edge bar */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `linear-gradient(to right, ${accentVar}, transparent)`,
                    opacity: 0.7
                  }} />

                  {/* Header info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ 
                        fontFamily: "Fira Code, monospace", 
                        fontSize: 10, 
                        color: accentVar, 
                        letterSpacing: "0.15em",
                        fontWeight: 700
                      }}>
                        // STEP {step.num}
                      </span>
                      <span style={{
                        fontFamily: "Fira Code, monospace",
                        fontSize: 8,
                        color: "var(--text-muted)",
                      }}>
                        {step.tech}
                      </span>
                    </div>
                    <span className="step-icon" style={{ fontSize: 18, transition: "transform 0.4s ease" }}>{step.icon}</span>
                  </div>

                  <h3 style={{ 
                    fontFamily: "Orbitron, sans-serif", 
                    fontWeight: 700, 
                    fontSize: 18, 
                    color: "var(--text-bright)", 
                    marginBottom: 8, 
                    letterSpacing: "0.02em" 
                  }}>
                    {step.title}
                  </h3>
                  
                  <p style={{ 
                    fontFamily: "Inter, sans-serif", 
                    fontSize: 13, 
                    color: "var(--text-muted)", 
                    lineHeight: 1.6, 
                    margin: 0 
                  }}>
                    {step.desc}
                  </p>

                  {/* Technical stats grid overlay */}
                  <div className="tech-stats-grid">
                    {step.metrics.map((m, idx) => (
                      <div key={idx} className="tech-stat-pill">
                        {m}
                      </div>
                    ))}
                  </div>

                  {/* Mini status ticker at the bottom */}
                  <div style={{ 
                    marginTop: 12, 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <span style={{
                      fontFamily: "Fira Code, monospace",
                      fontSize: 8,
                      color: "rgba(255,255,255,0.3)"
                    }}>
                      {step.stat}
                    </span>
                    <span style={{
                      fontFamily: "Fira Code, monospace",
                      fontSize: 8,
                      color: accentVar,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <span style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: accentVar,
                        display: "inline-block"
                      }} />
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
