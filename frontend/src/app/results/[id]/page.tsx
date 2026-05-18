"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import CyberCard from "@/components/ui/CyberCard";

const MODELS = [
  { name: "XGBoost", accuracy: 83.4, f1: 0.81, auc: 0.88, precision: 0.84, recall: 0.79, best: true },
  { name: "Random Forest", accuracy: 81.9, f1: 0.79, auc: 0.86, precision: 0.82, recall: 0.77, best: false },
  { name: "Logistic Regression", accuracy: 79.6, f1: 0.76, auc: 0.84, precision: 0.78, recall: 0.75, best: false },
  { name: "SVM", accuracy: 78.2, f1: 0.74, auc: 0.82, precision: 0.76, recall: 0.72, best: false },
];

const FEATURES = [
  { name: "Sex", importance: 0.32, color: "var(--cyan)" },
  { name: "Pclass", importance: 0.21, color: "var(--purple)" },
  { name: "Age", importance: 0.18, color: "var(--pink)" },
  { name: "Fare", importance: 0.14, color: "var(--green)" },
  { name: "SibSp", importance: 0.08, color: "var(--amber)" },
  { name: "Embarked", importance: 0.07, color: "var(--cyan)" },
];

export default function ResultsPage({ params }: { params: Promise<{ id: string }> | any }) {
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

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "100px 24px 80px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
          <div>
            <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// ANALYSIS RESULTS</p>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.4rem)", color: "var(--text-bright)", marginBottom: 6 }}>
              titanic.csv — Results
            </h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", border: "1px solid var(--border-faint)", padding: "3px 10px" }}>891 rows</span>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", border: "1px solid rgba(0,245,255,0.2)", padding: "3px 10px" }}>Classification</span>
              <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--green)", border: "1px solid rgba(0,255,136,0.2)", padding: "3px 10px" }}>Best: XGBoost 83.4%</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <NeonButton href={`/chat/${sessionId}`} variant="cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              Ask AI
            </NeonButton>
            <NeonButton variant="ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Export
            </NeonButton>
          </div>
        </div>

        {/* Metric summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border-faint)", border: "1px solid var(--border-faint)", marginBottom: 32 }}>
          {[
            { label: "Best Model", value: "XGBoost", color: "var(--cyan)" },
            { label: "Accuracy", value: "83.4%", color: "var(--green)" },
            { label: "ROC-AUC", value: "0.88", color: "var(--purple)" },
            { label: "F1-Score", value: "0.81", color: "var(--pink)" },
          ].map((m) => (
            <div key={m.label} style={{ padding: "24px 20px", background: "var(--bg-card)", textAlign: "center" }}>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "1.8rem", color: m.color, marginBottom: 6 }}>{m.value}</div>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Two-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Model comparison table */}
          <CyberCard noPad>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-faint)" }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.16em", textTransform: "uppercase" }}>// Model Comparison</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-faint)" }}>
                  {["Model", "Accuracy", "F1", "AUC"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.name} className={`model-row ${m.best ? "best" : ""}`}>
                    <td style={{ padding: "12px 16px", fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: 14, color: m.best ? "var(--cyan)" : "var(--text-primary)" }}>
                      {m.name} {m.best && <span style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--green)", border: "1px solid var(--green)", padding: "1px 5px", marginLeft: 6 }}>BEST</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-primary)" }}>{m.accuracy}%</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-primary)" }}>{m.f1}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-primary)" }}>{m.auc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CyberCard>

          {/* Feature importance */}
          <CyberCard noPad>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-faint)" }}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--purple)", letterSpacing: "0.16em", textTransform: "uppercase" }}>// SHAP Feature Importance</p>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {FEATURES.map((f) => (
                <div key={f.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-primary)" }}>{f.name}</span>
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: f.color }}>{f.importance.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-panel)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${f.importance * 100 / 0.32 * 100}%`, background: f.color, borderRadius: 3, boxShadow: `0 0 8px ${f.color}80`, maxWidth: "100%", transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>
        </div>

        {/* AI Insight card */}
        <CyberCard accent="purple">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, border: "1px solid var(--purple)", background: "rgba(191,0,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={1.5} width={20} height={20}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--purple)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>// AI INSIGHT</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                <strong style={{ color: "var(--text-primary)" }}>Sex is the most impactful feature (SHAP: 0.32)</strong> — female passengers had a 74% survival rate vs 19% for males. 
                Passenger class (Pclass) is the second strongest predictor. To improve accuracy further, consider engineering features like FamilySize = SibSp + Parch, 
                or adding title extraction from the Name column.
              </p>
            </div>
          </div>
        </CyberCard>
      </div>
    </main>
  );
}
