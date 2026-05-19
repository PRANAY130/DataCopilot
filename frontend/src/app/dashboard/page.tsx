"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import { useAuthHeader, useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface SessionSummary {
  session_id: string;
  filename: string;
  status: string;
  created_at: string;
  best_model?: string;
  best_accuracy?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const authHeader = useAuthHeader();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers["Authorization"] = authHeader;
      const res = await fetch(`${BACKEND_URL}/api/sessions`, { headers });
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [authHeader]);

  const handleDelete = async (sessionId: string) => {
    setDeleting(sessionId);
    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers["Authorization"] = authHeader;
      await fetch(`${BACKEND_URL}/api/session/${sessionId}`, { method: "DELETE", headers });
      setSessions(s => s.filter(x => x.session_id !== sessionId));
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffH = Math.floor(diffMs / 3600000);
      if (diffH < 1) return "Just now";
      if (diffH < 24) return `${diffH}h ago`;
      return `${Math.floor(diffH / 24)}d ago`;
    } catch { return iso; }
  };

  return (
    <main style={{ background: "var(--bg-void)", minHeight: "100vh" }} className="cyber-grid-sm">
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <p className="section-eyebrow" style={{ color: "var(--cyan)" }}>// MY WORKSPACE</p>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "clamp(1.6rem,3vw,2.4rem)", color: "var(--text-bright)" }}>
              Analysis History
            </h1>
            {user && (
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                Signed in as {user.email}
              </p>
            )}
          </div>
          <NeonButton href="/upload" variant="solid-cyan">
            + New Analysis
          </NeonButton>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="pulse-dot" style={{ backgroundColor: "var(--cyan)", width: 10, height: 10, margin: "0 auto 16px" }} />
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 13, color: "var(--text-muted)" }}>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", border: "1px dashed var(--border-faint)" }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              No analyses yet. Upload a dataset to get started.
            </p>
            <NeonButton href="/upload" variant="cyan">Upload Dataset</NeonButton>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border-faint)" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 120px 120px", gap: 0, background: "var(--bg-panel)", padding: "10px 20px" }}>
              {["Dataset", "Task Type", "Best Model", "Accuracy", "Created"].map(h => (
                <span key={h} style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {sessions.map(s => {
              const statusColor = s.status === "done" ? "var(--green)" : s.status === "error" ? "var(--pink)" : "var(--amber)";
              return (
                <div key={s.session_id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 120px 120px", gap: 0, background: "var(--bg-card)", padding: "16px 20px", alignItems: "center", transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}>
                  {/* Filename + actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                    <div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-bright)" }}>{s.filename}</div>
                      <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)" }}>{s.session_id}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
                      {s.status === "done" && (
                        <>
                          <a href={`/results/${s.session_id}`} style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", textDecoration: "none", border: "1px solid rgba(0,245,255,0.3)", padding: "2px 8px" }}>Results</a>
                          <a href={`/chat/${s.session_id}`} style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--purple)", textDecoration: "none", border: "1px solid rgba(191,0,255,0.3)", padding: "2px 8px" }}>Ask AI</a>
                        </>
                      )}
                      {s.status === "running" && (
                        <a href={`/analysis/${s.session_id}`} style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--amber)", textDecoration: "none", border: "1px solid rgba(255,187,0,0.3)", padding: "2px 8px" }}>View Pipeline</a>
                      )}
                    </div>
                  </div>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)" }}>—</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-primary)" }}>{s.best_model || "—"}</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: s.best_accuracy ? "var(--green)" : "var(--text-muted)" }}>
                    {s.best_accuracy ? `${(s.best_accuracy * 100).toFixed(1)}%` : "—"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)" }}>{formatDate(s.created_at)}</span>
                    <button onClick={() => handleDelete(s.session_id)} disabled={deleting === s.session_id}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: 14, padding: "2px 4px", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--pink)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
