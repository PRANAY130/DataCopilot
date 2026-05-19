"use client";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/auth/LoginPage";
import { ReactNode } from "react";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, firebaseConfigured } = useAuth();

  // Show spinner while Firebase checks auth state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-void)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "Fira Code, monospace",
          fontSize: 12,
          color: "var(--cyan)",
          letterSpacing: "0.15em",
        }}>
          // INITIALIZING...
        </div>
      </div>
    );
  }

  // If Firebase is NOT configured → skip auth entirely (DEV/local mode)
  if (!firebaseConfigured) {
    return <>{children}</>;
  }

  // Firebase IS configured but user is not logged in → show login
  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
