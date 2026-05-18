"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#pipeline" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Periodic glitch on logo
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="navbar"
      style={{
        borderBottomColor: scrolled ? "rgba(0,245,255,0.15)" : "rgba(0,245,255,0.06)",
        transition: "border-color 0.3s",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LOGO */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "rgba(0,245,255,0.06)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 3,
                background: "rgba(0,245,255,0.08)",
                border: "1px solid rgba(0,245,255,0.2)",
              }}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={16} height={16} style={{ position: "relative", zIndex: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>

          {/* Wordmark */}
          <span
            className={glitching ? "glitch-wrapper" : ""}
            data-text="DATACOPILOT"
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.14em",
              color: "var(--cyan)",
            }}
          >
            DATACOPILOT
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                letterSpacing: "0.04em",
                color: pathname === link.href ? "var(--cyan)" : "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = pathname === link.href ? "var(--cyan)" : "var(--text-muted)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* RIGHT ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Status pill */}
          <div
            className="hide-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              border: "1px solid rgba(0,255,136,0.3)",
              fontFamily: "Fira Code, monospace",
              fontSize: 10,
              color: "var(--green)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <div className="pulse-dot" style={{ backgroundColor: "var(--green)", width: 6, height: 6 }} />
            Online
          </div>

          <Link href="/upload" className="btn btn-lg btn-cyan" style={{ padding: "10px 22px", fontSize: 12 }}>
            Launch App
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "none",
              background: "transparent",
              border: "1px solid var(--border-dim)",
              color: "var(--text-primary)",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
}
