"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const PHRASES = [
  "Classification · Regression · Clustering",
  "Gemini + Groq AI Reasoning",
  "SHAP · LIME Explainability",
  "AutoML · Zero Code Required",
];

function useTypewriter(phrases: string[]) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const cur = phrases[idx];
    const delay = del ? 22 : ci === cur.length ? 2000 : 55;
    const t = setTimeout(() => {
      if (!del && ci < cur.length) { setText(cur.slice(0, ci + 1)); setCi(i => i + 1); }
      else if (!del && ci === cur.length) { setDel(true); }
      else if (del && ci > 0) { setText(cur.slice(0, ci - 1)); setCi(i => i - 1); }
      else { setDel(false); setIdx(i => (i + 1) % phrases.length); }
    }, delay);
    return () => clearTimeout(t);
  });
  return text;
}

const TERMINAL_LINES = [
  { t: 300,  color: "#6060a0", text: "$ datacopilot analyze --file titanic.csv" },
  { t: 900,  color: "#00f5ff", text: "✓ Dataset loaded: 891 rows × 12 cols" },
  { t: 1500, color: "#6060a0", text: "→ Detecting ML task type..." },
  { t: 2200, color: "#00ff88", text: "✓ Task: Binary Classification" },
  { t: 2900, color: "#6060a0", text: "→ Running Gemini analysis..." },
  { t: 3700, color: "#bf00ff", text: "✓ Target: Survived | Features: 11" },
  { t: 4400, color: "#6060a0", text: "→ Training XGBoost, RF, LR, SVM..." },
  { t: 5300, color: "#00ff88", text: "✓ Best: XGBoost — Accuracy: 83.4%" },
  { t: 6100, color: "#ffbb00", text: "→ Computing SHAP explanations..." },
  { t: 6900, color: "#00f5ff", text: "✓ Top feature: Sex (importance: 0.32)" },
  { t: 7600, color: "#ff0066", text: "✓ Analysis complete in 7.6s" },
];

function TerminalWidget() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((line, i) => {
      const t = setTimeout(() => setVisibleLines(prev => [...prev, i]), line.t);
      timers.push(t);
    });
    // Loop: reset after last + 2s
    const reset = setTimeout(() => setVisibleLines([]), TERMINAL_LINES[TERMINAL_LINES.length - 1].t + 2000);
    timers.push(reset);
    return () => timers.forEach(clearTimeout);
  }, [visibleLines.length === 0 ? 0 : -1]); // Restart when reset

  return (
    <div style={{
      background: "#000008",
      border: "1px solid rgba(0,245,255,0.2)",
      fontFamily: "'Fira Code', monospace",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Terminal header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 16px",
        borderBottom: "1px solid rgba(0,245,255,0.1)",
        background: "rgba(0,245,255,0.03)",
      }}>
        {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: "#6060a0", letterSpacing: "0.08em" }}>
          datacopilot — analysis
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", animation: "pulse-glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 9, color: "#00ff88", letterSpacing: "0.1em" }}>LIVE</span>
        </div>
      </div>

      {/* Lines */}
      <div style={{ padding: "16px", minHeight: 260, display: "flex", flexDirection: "column", gap: 6 }}>
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              color: visibleLines.includes(i) ? line.color : "transparent",
              transition: "color 0.2s, opacity 0.3s",
              opacity: visibleLines.includes(i) ? 1 : 0,
              letterSpacing: "0.03em",
              lineHeight: 1.5,
            }}
          >
            {line.text}
          </div>
        ))}
        {/* Blinking cursor */}
        <div style={{ color: "#00f5ff", fontSize: 12, marginTop: 2 }}>
          <span style={{ animation: "blink 1s step-end infinite" }}>▮</span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const typed = useTypewriter(PHRASES);

  return (
    <section style={{
      position: "relative",
      paddingTop: 96,
      paddingBottom: 80,
      overflow: "hidden",
    }}>
      <style>{`
        /* -------- HERO SCOPED STYLES -------- */
        .h-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px;
          border: 1px solid rgba(0,245,255,0.3);
          background: rgba(0,245,255,0.06);
          font-family: 'Fira Code', monospace; font-size: 11px;
          color: var(--cyan); letter-spacing: 0.12em; text-transform: uppercase;
          animation: badge-pulse 3s ease-in-out infinite;
        }
        @keyframes badge-pulse {
          0%,100%{box-shadow:0 0 6px rgba(0,245,255,0.15)}
          50%{box-shadow:0 0 18px rgba(0,245,255,0.4),0 0 40px rgba(0,245,255,0.12)}
        }

        /* Primary CTA */
        .h-btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid var(--cyan);
          color: var(--cyan);
          font-family: 'Rajdhani', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
          transition: all 0.2s ease;
          position: relative; overflow: hidden;
        }
        .h-btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(0,245,255,0.35) 0%, rgba(0,245,255,0.08) 100%);
          opacity: 0; transition: opacity 0.2s;
        }
        .h-btn-primary:hover {
          color: #ffffff;
          border-color: #fff;
          transform: translateY(-3px);
          box-shadow:
            0 0 0 1px rgba(0,245,255,0.5),
            0 0 20px rgba(0,245,255,0.7),
            0 0 60px rgba(0,245,255,0.25),
            0 8px 25px rgba(0,0,0,0.5);
          text-shadow: 0 0 12px rgba(0,245,255,1);
        }
        .h-btn-primary:hover::after { opacity: 1; }
        .h-btn-primary:active { transform: translateY(-1px); box-shadow: 0 0 12px rgba(0,245,255,0.5); }

        /* Ghost CTA */
        .h-btn-ghost {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.55);
          font-family: 'Rajdhani', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
          transition: all 0.2s ease;
        }
        .h-btn-ghost:hover {
          color: #ffffff;
          border-color: rgba(255,255,255,0.65);
          background: rgba(255,255,255,0.07);
          transform: translateY(-3px);
          box-shadow: 0 0 20px rgba(255,255,255,0.1), 0 8px 25px rgba(0,0,0,0.4);
        }
        .h-btn-ghost:active { transform: translateY(-1px); }

        /* Stat pill */
        .h-stat {
          padding: 10px 20px; text-align: center; cursor: default;
          border-left: 1px solid rgba(0,245,255,0.08);
          transition: background 0.25s ease;
        }
        .h-stat:first-child { border-left: none; }
        .h-stat:hover { background: rgba(0,245,255,0.05); }
        .h-stat:hover .h-stat-val { text-shadow: 0 0 14px rgba(0,245,255,1), 0 0 40px rgba(0,245,255,0.6); }
        .h-stat-val {
          font-family: 'Orbitron', sans-serif; font-weight: 800;
          font-size: 1.4rem; color: var(--cyan);
          text-shadow: 0 0 8px rgba(0,245,255,0.5);
          transition: text-shadow 0.25s ease;
        }
        .h-stat-lbl {
          font-family: 'Fira Code', monospace; font-size: 9px;
          color: rgba(160,160,200,0.6); letter-spacing: 0.14em; text-transform: uppercase; margin-top: 4px;
        }

        /* Floating metric card */
        .h-metric {
          padding: 12px 16px;
          border: 1px solid rgba(0,245,255,0.15);
          background: rgba(4,4,16,0.9);
          backdrop-filter: blur(12px);
          transition: all 0.25s ease;
          cursor: default;
        }
        .h-metric:hover {
          border-color: var(--cyan);
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 0 20px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1);
        }

        /* Orb background */
        .h-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(70px); animation: orb-drift 12s ease-in-out infinite;
        }

        @keyframes h-float {
          0%,100%{ transform: translateY(0); }
          50%{ transform: translateY(-8px); }
        }
        .h-float { animation: h-float 4s ease-in-out infinite; }

        @keyframes shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
      `}</style>

      {/* Background orbs */}
      <div className="h-orb" style={{ width: 500, height: 500, background: "rgba(0,245,255,0.07)", top: "-20%", left: "-8%" }} />
      <div className="h-orb" style={{ width: 400, height: 400, background: "rgba(191,0,255,0.07)", top: "10%", right: "-5%", animationDelay: "-5s" }} />

      {/* Subtle horizontal grid lines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,245,255,0.025) 0px, transparent 1px, transparent 80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 1 }}>

        {/* ===== SPLIT LAYOUT ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 64, alignItems: "center" }}>

          {/* LEFT: Text content */}
          <div>
            {/* Badge */}
            <div style={{ marginBottom: 28 }}>
              <span className="h-badge">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", animation: "pulse-glow 2s ease-in-out infinite", display: "inline-block" }} />
                AI System Online · Gemini + Groq
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4.5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 20 }}>
              <span style={{ display: "block", color: "#ffffff", marginBottom: "0.1em" }}>
                THE ADAPTIVE
              </span>
              <span style={{
                display: "block",
                marginBottom: "0.1em",
                background: "linear-gradient(100deg, var(--cyan) 0%, #ffffff 45%, var(--purple) 85%, var(--cyan) 100%)",
                backgroundSize: "250% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 4s linear infinite",
                filter: "drop-shadow(0 0 20px rgba(0,245,255,0.3))",
              }}>
                DATA SCIENCE
              </span>
              <span style={{ display: "block", color: "#ffffff" }}>
                COPILOT
              </span>
            </h1>

            {/* Typewriter */}
            <div style={{ height: 26, marginBottom: 20 }}>
              <span style={{
                fontFamily: "'Fira Code', monospace", fontSize: 13,
                color: "rgba(0,245,255,0.7)", letterSpacing: "0.06em",
              }}>
                {typed}<span style={{ animation: "blink 1s step-end infinite", color: "var(--cyan)" }}>▮</span>
              </span>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16, lineHeight: 1.75,
              color: "rgba(160,160,200,0.75)", maxWidth: 500, marginBottom: 36,
            }}>
              Upload any CSV or JSON dataset. The AI automatically analyzes structure, detects the ML task, preprocesses data, trains &amp; benchmarks models, and explains results — in under{" "}
              <span style={{ color: "var(--cyan)", fontWeight: 600 }}>60 seconds</span>.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/upload" className="h-btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Upload Dataset
              </Link>
              <Link href="/#features" className="h-btn-ghost">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.625 7.5 7.5 7.5-7.5M4.5 11.625l7.5 7.5 7.5-7.5" />
                </svg>
                Explore Features
              </Link>
            </div>

            {/* Stats strip */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4,1fr)",
              border: "1px solid rgba(0,245,255,0.1)",
              background: "rgba(4,4,16,0.8)",
              backdropFilter: "blur(12px)",
            }}>
              {[
                { v: "10+", l: "Models" },
                { v: "4", l: "Task Types" },
                { v: "60s", l: "Pipeline" },
                { v: "100%", l: "Automated" },
              ].map(s => (
                <div key={s.l} className="h-stat">
                  <div className="h-stat-val">{s.v}</div>
                  <div className="h-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Live terminal + floating metric cards */}
          <div style={{ position: "relative" }}>
            {/* Floating metric cards */}
            <div className="h-metric h-float" style={{
              position: "absolute", top: -20, right: -16, zIndex: 2,
              minWidth: 150, animationDelay: "0s",
            }}>
              <div style={{ fontFamily: "'Fira Code',monospace", fontSize: 9, color: "var(--green)", letterSpacing: "0.12em", marginBottom: 4 }}>BEST MODEL</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>XGBoost</div>
              <div style={{ fontFamily: "'Fira Code',monospace", fontSize: 11, color: "var(--cyan)" }}>83.4% accuracy</div>
            </div>

            <div className="h-metric h-float" style={{
              position: "absolute", bottom: 40, left: -20, zIndex: 2,
              minWidth: 140, animationDelay: "-2s",
              borderColor: "rgba(191,0,255,0.25)",
            }}>
              <div style={{ fontFamily: "'Fira Code',monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.12em", marginBottom: 4 }}>SHAP INSIGHT</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Sex</div>
              <div style={{ fontFamily: "'Fira Code',monospace", fontSize: 11, color: "var(--purple)" }}>importance 0.32</div>
            </div>

            {/* Terminal */}
            <TerminalWidget />
          </div>
        </div>

        {/* ===== TECH STRIP ===== */}
        <div style={{
          marginTop: 64,
          paddingTop: 28,
          borderTop: "1px solid rgba(0,245,255,0.08)",
          display: "flex", alignItems: "center", gap: 0,
        }}>
          <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 10, color: "rgba(96,96,160,0.7)", letterSpacing: "0.1em", marginRight: 28, whiteSpace: "nowrap" }}>
            POWERED BY
          </span>
          <div style={{ display: "flex", gap: 0, flex: 1 }}>
            {[
              { name: "Google Gemini", color: "var(--cyan)" },
              { name: "Groq AI", color: "var(--purple)" },
              { name: "Firebase", color: "#ffbb00" },
              { name: "Neon DB", color: "var(--green)" },
              { name: "XGBoost", color: "var(--pink)" },
              { name: "SHAP / LIME", color: "var(--cyan)" },
            ].map((tech, i) => (
              <div
                key={tech.name}
                style={{
                  padding: "8px 20px",
                  fontFamily: "'Fira Code',monospace", fontSize: 11,
                  color: "rgba(160,160,200,0.5)",
                  borderLeft: i > 0 ? "1px solid rgba(0,245,255,0.06)" : undefined,
                  cursor: "default",
                  transition: "color 0.2s ease",
                  letterSpacing: "0.06em",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = tech.color; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(160,160,200,0.5)"; }}
              >
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
