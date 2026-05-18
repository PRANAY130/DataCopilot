import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
