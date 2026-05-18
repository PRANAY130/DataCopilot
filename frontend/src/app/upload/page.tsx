import Navbar from "@/components/layout/Navbar";
import UploadZone from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid">
      <Navbar />

      <div style={{ paddingTop: 120, paddingBottom: 80, padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Page header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// BEGIN ANALYSIS</p>
            <h1
              className="section-title shimmer-cyan"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: 14 }}
            >
              Upload Your Dataset
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>
              Drop any CSV or JSON file. The AI will handle everything automatically — from preprocessing to explainability.
            </p>
          </div>

          {/* Upload Zone */}
          <div
            style={{
              border: "1px solid var(--border-faint)",
              background: "var(--bg-card)",
              padding: "40px",
              position: "relative",
            }}
          >
            {/* Corner brackets */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 24, height: 24, borderTop: "1px solid var(--cyan)", borderLeft: "1px solid var(--cyan)" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderBottom: "1px solid var(--cyan)", borderRight: "1px solid var(--cyan)" }} />

            <UploadZone />
          </div>

          {/* Supported formats */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { icon: "📄", title: "CSV Files", desc: "Standard comma-separated values with headers" },
              { icon: "{ }", title: "JSON Files", desc: "Flat or nested JSON array structures" },
              { icon: "🔒", title: "Secure", desc: "Files never stored permanently on our servers" },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "20px",
                  border: "1px solid var(--border-faint)",
                  background: "var(--bg-card)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "0.05em" }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
