import Link from "next/link";

const LINKS = [
  { group: "Product", items: [{ label: "Features", href: "/#features" }, { label: "How It Works", href: "/#pipeline" }, { label: "Upload Dataset", href: "/upload" }] },
  { group: "Technology", items: [{ label: "Gemini AI", href: "#" }, { label: "Groq AI", href: "#" }, { label: "Firebase", href: "#" }, { label: "Neon DB", href: "#" }] },
  { group: "Resources", items: [{ label: "Documentation", href: "/docs" }, { label: "API Reference", href: "#" }, { label: "GitHub", href: "#" }] },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-deep)",
        borderTop: "1px solid var(--border-faint)",
        paddingTop: 72,
        paddingBottom: 32,
      }}
    >
      <style>{`.footer-link{font-family:'Inter',sans-serif;font-size:13px;color:var(--text-muted);text-decoration:none;transition:color .2s;}.footer-link:hover{color:var(--text-primary);}`}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, border: "1px solid var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,245,255,0.05)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={14} height={14}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "var(--cyan)" }}>DATACOPILOT</span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 260 }}>
              The intelligent AI data science assistant that reasons about your data, automates ML workflows, and explains results in plain language.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {["Gemini", "Groq", "Firebase", "Neon"].map((t) => (
                <span key={t} style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", border: "1px solid var(--border-faint)", padding: "3px 8px", letterSpacing: "0.08em" }}>{t}</span>
              ))}
            </div>
          </div>

          {LINKS.map((group) => (
            <div key={group.group}>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 16 }}>
                // {group.group}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.items.map((item) => (
                  <Link key={item.label} href={item.href} className="footer-link">{item.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-faint)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em" }}>
            © 2025 DataCopilot · AI-Powered Data Science Platform
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="pulse-dot" style={{ backgroundColor: "var(--green)", width: 6, height: 6 }} />
            <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--green)", letterSpacing: "0.1em" }}>
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
