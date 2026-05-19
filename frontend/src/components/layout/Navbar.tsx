"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#pipeline" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, firebaseConfigured } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      <style>{`
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: rgba(4, 4, 16, 0.98);
          border: 1px solid rgba(0, 245, 255, 0.2);
          backdrop-filter: blur(20px);
          z-index: 9999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(0,245,255,0.08);
          animation: fadeIn 0.15s ease;
        }
        .profile-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1.5px solid var(--cyan);
          cursor: pointer;
          transition: box-shadow 0.2s;
          object-fit: cover;
        }
        .profile-avatar:hover {
          box-shadow: 0 0 12px rgba(0,245,255,0.5);
        }
        .profile-avatar-placeholder {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1.5px solid var(--cyan);
          background: rgba(0,245,255,0.1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-family: Orbitron, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--cyan);
          transition: box-shadow 0.2s;
          flex-shrink: 0;
        }
        .profile-avatar-placeholder:hover {
          box-shadow: 0 0 12px rgba(0,245,255,0.5);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.15s;
          border-bottom: 1px solid var(--border-faint);
          cursor: pointer;
          background: transparent;
          border-left: none; border-right: none; border-top: none;
          width: 100%;
          text-align: left;
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover {
          background: rgba(0,245,255,0.04);
          color: var(--text-bright);
        }
        .dropdown-item.danger:hover {
          background: rgba(255,0,102,0.06);
          color: var(--pink);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        maxWidth: 1400, margin: "0 auto", padding: "0 24px",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* LOGO */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, border: "1px solid var(--cyan)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", background: "rgba(0,245,255,0.06)", flexShrink: 0,
          }}>
            <div style={{ position: "absolute", inset: 3, background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }} />
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={16} height={16} style={{ position: "relative", zIndex: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <span
            className={glitching ? "glitch-wrapper" : ""}
            data-text="DATACOPILOT"
            style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.14em", color: "var(--cyan)" }}
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
                fontFamily: "Inter, sans-serif", fontSize: 13, letterSpacing: "0.04em",
                color: pathname === link.href ? "var(--cyan)" : "var(--text-muted)",
                textDecoration: "none", transition: "color 0.2s",
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
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", border: "1px solid rgba(0,255,136,0.3)",
              fontFamily: "Fira Code, monospace", fontSize: 10,
              color: "var(--green)", letterSpacing: "0.12em", textTransform: "uppercase",
            }}
          >
            <div className="pulse-dot" style={{ backgroundColor: "var(--green)", width: 6, height: 6 }} />
            Online
          </div>

          {/* Show user profile if logged in, else Launch App button */}
          {user && firebaseConfigured ? (
            <div ref={profileRef} style={{ position: "relative" }}>
              <div onClick={() => setProfileOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {user.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="hide-mobile" style={{ lineHeight: 1.3 }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-bright)" }}>
                    {user.displayName?.split(" ")[0] || "User"}
                  </div>
                  <div style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--cyan)" }}>
                    ● AUTHENTICATED
                  </div>
                </div>
              </div>

              {profileOpen && (
                <div className="profile-dropdown">
                  {/* User info header */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-faint)" }}>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-bright)", marginBottom: 2 }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)" }}>
                      {user.email}
                    </div>
                  </div>

                  <Link href="/upload" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                    New Analysis
                  </Link>

                  <Link href="/dashboard" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                    My Sessions
                  </Link>

                  <button className="dropdown-item danger" onClick={() => { signOut(); setProfileOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/upload" className="btn btn-lg btn-cyan" style={{ padding: "10px 22px", fontSize: 12 }}>
              Launch App
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "none", background: "transparent",
              border: "1px solid var(--border-dim)", color: "var(--text-primary)",
              padding: "8px", cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
}
