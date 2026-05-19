"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg-void)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }} className="cyber-grid">
      <style>{`
        .login-card {
          width: 420px;
          background: rgba(6, 6, 12, 0.9);
          border: 1px solid var(--border-dim);
          padding: 52px 48px;
          position: relative;
          backdrop-filter: blur(20px);
          text-align: center;
        }
        .google-btn {
          width: 100%;
          padding: 14px 24px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.4);
          color: var(--text-bright);
          font-family: "Rajdhani", sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .google-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 245, 255, 0.04);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .google-btn:hover::before { opacity: 1; }
        .google-btn:hover {
          border-color: var(--cyan);
          box-shadow: 0 0 24px rgba(0, 245, 255, 0.3), inset 0 0 12px rgba(0, 245, 255, 0.08);
          transform: translateY(-2px);
        }
        .google-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .corner { position: absolute; width: 16px; height: 16px; }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid var(--cyan); border-left: 2px solid var(--cyan); }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--cyan); border-right: 2px solid var(--cyan); }
      `}</style>

      <div className="login-card">
        <div className="corner corner-tl" />
        <div className="corner corner-br" />

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            border: "1px solid rgba(0,245,255,0.3)",
            background: "rgba(0,245,255,0.06)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 20px rgba(0,245,255,0.15)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={28} height={28}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
            // AUTHENTICATION REQUIRED
          </p>
          <h1 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "var(--text-bright)", marginBottom: 8 }}>
            DataCopilot
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Sign in to access your AI-powered AutoML workspace
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-faint)", marginBottom: 28 }} />

        {/* Google Sign In */}
        <button className="google-btn" onClick={handleSignIn} disabled={loading}>
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: "2px solid var(--cyan)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
              Connecting...
            </>
          ) : (
            <>
              {/* Google icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--pink)", marginTop: 16 }}>
            ⚠ {error}
          </p>
        )}

        <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--text-dim)", marginTop: 28, letterSpacing: "0.08em" }}>
          // Secured via Google OAuth · No passwords stored
        </p>
      </div>
    </main>
  );
}
