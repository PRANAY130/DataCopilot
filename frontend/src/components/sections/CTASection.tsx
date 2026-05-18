import NeonButton from "@/components/ui/NeonButton";
import ParallaxLayer from "@/components/ui/ParallaxLayer";

export default function CTASection() {
  return (
    <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      <ParallaxLayer speed={0.2} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div className="orb" style={{ width: 600, height: 600, background: "rgba(0,245,255,0.07)", top: "10%", left: "50%", transform: "translateX(-50%)", animationDelay: "-3s" }} />
      </ParallaxLayer>

      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            border: "1px solid var(--border-dim)",
            background: "rgba(8,8,24,0.9)",
            padding: "72px 48px",
            position: "relative",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Corner brackets */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 24, height: 24, borderTop: "1px solid var(--cyan)", borderLeft: "1px solid var(--cyan)" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 24, height: 24, borderTop: "1px solid var(--cyan)", borderRight: "1px solid var(--cyan)" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 24, height: 24, borderBottom: "1px solid var(--cyan)", borderLeft: "1px solid var(--cyan)" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderBottom: "1px solid var(--cyan)", borderRight: "1px solid var(--cyan)" }} />

          <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// BEGIN ANALYSIS</p>
          <h2
            className="section-title shimmer-cyan"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: 16 }}
          >
            Ready to analyze your data?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "var(--text-muted)", marginBottom: 40, lineHeight: 1.7 }}>
            Drop your CSV and let the AI handle everything — from preprocessing to explainability.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <NeonButton href="/upload" variant="solid-cyan" size="lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Dataset
            </NeonButton>
            <NeonButton href="/chat/demo" variant="ghost" size="lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Try AI Chat
            </NeonButton>
          </div>
        </div>
      </div>
    </section>
  );
}
