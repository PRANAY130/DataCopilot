import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SessionProvider } from "@/context/SessionContext";
import AuthGate from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "DataCopilot — AI-Powered Data Science Copilot",
  description: "Upload any dataset. The AI automatically analyzes, preprocesses, trains models, explains results, and answers your questions in under 60 seconds.",
  keywords: ["AI", "Data Science", "Machine Learning", "AutoML", "Gemini", "Groq"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Scanline overlay for CRT effect */}
        <div className="scanline-overlay" />
        {/* Subtle noise texture */}
        <div className="noise-overlay" />
        <AuthProvider>
          <SessionProvider>
            <AuthGate>
              {children}
            </AuthGate>
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

