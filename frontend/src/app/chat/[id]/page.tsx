import Navbar from "@/components/layout/Navbar";
import ChatInterface from "@/components/chat/ChatInterface";
import NeonButton from "@/components/ui/NeonButton";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh", display: "flex", flexDirection: "column" }} className="cyber-grid-sm">
      <Navbar />

      <div style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "88px 24px 24px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "stretch" }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
          <div>
            <p className="section-eyebrow" style={{ color: "var(--cyan)", marginBottom: 4 }}>// AI ASSISTANT</p>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--text-bright)" }}>Conversational Analytics</h1>
          </div>

          {/* Session info */}
          <div style={{ border: "1px solid var(--border-faint)", background: "var(--bg-card)", padding: "18px" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Session</p>
            {[
              { label: "Dataset", value: "titanic.csv" },
              { label: "Task", value: "Classification" },
              { label: "Best Model", value: "XGBoost" },
              { label: "Accuracy", value: "83.4%" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)" }}>{row.label}</span>
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-primary)" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ border: "1px solid var(--border-faint)", background: "var(--bg-card)", padding: "18px" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Navigate</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <NeonButton href={`/results/${params.id}`} variant="ghost" size="sm">← Back to Results</NeonButton>
              <NeonButton href="/upload" variant="ghost" size="sm">New Analysis</NeonButton>
            </div>
          </div>

          {/* AI Models indicator */}
          <div style={{ border: "1px solid rgba(0,255,136,0.15)", background: "rgba(0,255,136,0.03)", padding: "14px 18px" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--green)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>// AI Engines</p>
            {["Gemini 2.0 Flash", "Groq Llama-3"].map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div className="pulse-dot" style={{ backgroundColor: "var(--green)", width: 5, height: 5 }} />
                <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div
          style={{
            border: "1px solid var(--border-faint)",
            background: "var(--bg-card)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            height: "calc(100vh - 120px)",
          }}
          className="cyber-card"
        >
          <ChatInterface sessionId={params.id} />
        </div>
      </div>
    </main>
  );
}
