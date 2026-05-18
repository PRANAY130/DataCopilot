"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ParallaxLayer from "@/components/ui/ParallaxLayer";
import GlitchText from "@/components/ui/GlitchText";
import NeonButton from "@/components/ui/NeonButton";

const TYPEWRITER_PHRASES = [
  "Classifying your data...",
  "Training XGBoost models...",
  "Generating SHAP insights...",
  "Answering your questions...",
];

function useTypewriter(phrases: string[], speed = 60) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const delay = deleting ? 30 : charIdx === current.length ? 1500 : speed;
    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setText(current.slice(0, charIdx + 1));
        setCharIdx((i) => i + 1);
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setText(current.slice(0, charIdx - 1));
        setCharIdx((i) => i - 1);
      } else {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [text, charIdx, deleting, phraseIdx, phrases, speed]);

  return text;
}

export default function HeroSection() {
  const typed = useTypewriter(TYPEWRITER_PHRASES);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particle grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.opacity})`;
        ctx.fill();
      });

      // Lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,245,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 120,
        paddingBottom: 80,
      }}
      className="cyber-grid"
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      />

      {/* Glow orbs via parallax */}
      <ParallaxLayer speed={0.15} style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div className="orb" style={{ width: 600, height: 600, background: "rgba(0,245,255,0.05)", top: "5%", left: "-10%" }} />
        <div className="orb" style={{ width: 500, height: 500, background: "rgba(191,0,255,0.06)", top: "20%", right: "-8%", animationDelay: "-4s" }} />
        <div className="orb" style={{ width: 400, height: 400, background: "rgba(255,0,102,0.04)", bottom: "10%", left: "30%", animationDelay: "-8s" }} />
      </ParallaxLayer>

      {/* Horizontal scan line */}
      <div
        style={{
          position: "absolute",
          left: 0, right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
          opacity: 0.15,
          top: "30%",
          zIndex: 1,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 18px",
            border: "1px solid rgba(0,245,255,0.25)",
            background: "rgba(0,245,255,0.04)",
            marginBottom: 36,
            fontFamily: "Fira Code, monospace",
            fontSize: 11,
            color: "var(--cyan)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <div className="pulse-dot" style={{ backgroundColor: "var(--green)", width: 6, height: 6 }} />
          Powered by Gemini + Groq AI · Firebase + Neon
        </div>

        {/* Main headline */}
        <div style={{ marginBottom: 28 }}>
          <GlitchText
            text="AI-POWERED"
            tag="h1"
            interval={6000}
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 9vw, 7rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "var(--text-bright)",
              display: "block",
              marginBottom: 4,
            }}
          />
          <h1
            className="shimmer-cyan"
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 9vw, 7rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              display: "block",
              marginBottom: 4,
            }}
          >
            DATA SCIENCE
          </h1>
          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 9vw, 7rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "var(--text-bright)",
              display: "block",
            }}
          >
            COPILOT
          </h1>
        </div>

        {/* Typewriter */}
        <div
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span
            className="type-cursor"
            style={{
              fontFamily: "Fira Code, monospace",
              fontSize: 18,
              color: "var(--cyan)",
              letterSpacing: "0.04em",
            }}
          >
            {typed}
          </span>
        </div>

        {/* Sub text */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(15px, 2vw, 18px)",
            lineHeight: 1.75,
            color: "var(--text-muted)",
            maxWidth: 640,
            margin: "0 auto 44px",
          }}
        >
          Upload any dataset. The AI automatically analyzes structure, detects the ML task, preprocesses data, trains &amp; benchmarks models, generates visualizations, and answers your questions — in under{" "}
          <span style={{ color: "var(--cyan)" }}>60 seconds</span>.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
          <NeonButton href="/upload" variant="cyan" size="lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Upload Dataset
          </NeonButton>
          <NeonButton href="/#pipeline" variant="ghost" size="lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            See How It Works
          </NeonButton>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--border-faint)",
            background: "rgba(8,8,24,0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          {[
            { v: "10+", l: "ML Models" },
            { v: "4", l: "Task Types" },
            { v: "< 60s", l: "Full Pipeline" },
            { v: "100%", l: "Automated" },
          ].map((s, i) => (
            <div
              key={s.l}
              style={{
                padding: "22px 12px",
                borderLeft: i > 0 ? "1px solid var(--border-faint)" : undefined,
                textAlign: "center",
              }}
            >
              <div
                className="text-glow-cyan"
                style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.4rem,3vw,2rem)", color: "var(--cyan)" }}
              >
                {s.v}
              </div>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 180,
          background: "linear-gradient(transparent, var(--bg-void))",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </section>
  );
}
