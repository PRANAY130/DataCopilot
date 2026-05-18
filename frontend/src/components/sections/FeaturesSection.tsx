import CyberCard from "@/components/ui/CyberCard";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "Intelligent Dataset Analysis",
    desc: "Instantly extracts metadata, detects nulls, outliers, correlations, and class imbalance from any structured dataset without writing code.",
    color: "var(--cyan)",
    tag: "ANALYSIS",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Auto Task Detection",
    desc: "Dynamically identifies whether your problem is classification, regression, clustering, or time-series using LLM-based reasoning.",
    color: "var(--pink)",
    tag: "AI",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: "Smart Preprocessing",
    desc: "Automated imputation, one-hot encoding, StandardScaler, SMOTE for class imbalance — strategies adapt to your data automatically.",
    color: "var(--purple)",
    tag: "ML",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    title: "Multi-Model Training",
    desc: "Trains XGBoost, Random Forest, Logistic Regression, and SVMs in parallel. Auto-selects the best performer with full metric comparison.",
    color: "var(--green)",
    tag: "TRAINING",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    title: "Explainable AI (XAI)",
    desc: "SHAP values and LIME reveal exactly which features drive predictions. Every decision comes with a human-readable explanation.",
    color: "var(--cyan)",
    tag: "XAI",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    title: "Conversational AI Assistant",
    desc: "Ask 'Why is accuracy low?' or 'Which features matter most?' Powered by Gemini &amp; Groq for instant context-aware insights.",
    color: "var(--pink)",
    tag: "LLM",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// CORE MODULES</p>
          <h2
            className="section-title"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-bright)", marginBottom: 16 }}
          >
            Everything You Need.{" "}
            <span className="shimmer-pink">Nothing You Don&apos;t.</span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto" }}>
            Six intelligent modules working in concert to automate your entire data science workflow.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 1,
            background: "var(--border-faint)",
            border: "1px solid var(--border-faint)",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="cyber-card" style={{ background: "var(--bg-card)", padding: "32px 28px", border: "none" }}>
              {/* Tag */}
              <span
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: 9,
                  color: f.color,
                  border: `1px solid ${f.color}`,
                  padding: "2px 8px",
                  letterSpacing: "0.15em",
                  display: "inline-block",
                  marginBottom: 20,
                  opacity: 0.85,
                }}
              >
                {f.tag}
              </span>

              {/* Icon + Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    border: `1px solid ${f.color}30`,
                    background: `${f.color}0d`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: f.color,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "Rajdhani, sans-serif",
                    fontWeight: 600,
                    fontSize: 17,
                    color: "var(--text-bright)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {f.title}
                </h3>
              </div>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
