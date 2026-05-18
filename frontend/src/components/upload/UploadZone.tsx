"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "@/components/ui/NeonButton";

const ACCEPT_TYPES = [".csv", ".json"];

interface UploadZoneProps {
  onFileSelected?: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json"].includes(ext ?? "")) {
      setError("Only CSV and JSON files are supported.");
      return;
    }
    setError(null);
    setFile(f);
    onFileSelected?.(f);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = () => {
    if (!file) return;
    // TODO: upload to backend, get session id, navigate to analysis
    router.push("/analysis/demo");
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ borderRadius: 0, padding: "80px 40px" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_TYPES.join(",")}
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Corners */}
        {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((pos, i) => (
          <div key={i} style={{
            position: "absolute",
            ...(pos.includes("top-0 left-0") ? { top: 0, left: 0 } : {}),
            ...(pos.includes("top-0 right-0") ? { top: 0, right: 0 } : {}),
            ...(pos.includes("bottom-0 left-0") ? { bottom: 0, left: 0 } : {}),
            ...(pos.includes("bottom-0 right-0") ? { bottom: 0, right: 0 } : {}),
            width: 20, height: 20,
            borderColor: dragging ? "var(--cyan)" : "rgba(0,245,255,0.4)",
            borderTopWidth: pos.includes("border-t") ? 1 : 0,
            borderBottomWidth: pos.includes("border-b") ? 1 : 0,
            borderLeftWidth: pos.includes("border-l") ? 1 : 0,
            borderRightWidth: pos.includes("border-r") ? 1 : 0,
            borderStyle: "solid",
            transition: "border-color 0.3s",
          }} />
        ))}

        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          {file ? (
            <>
              {/* Success state */}
              <div
                style={{
                  width: 64, height: 64,
                  border: "1px solid var(--green)",
                  background: "rgba(0,255,136,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--green)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Dataset Loaded
              </p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{file.name}</p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              {/* Empty state */}
              <div
                style={{
                  width: 64, height: 64,
                  border: "1px solid rgba(0,245,255,0.25)",
                  background: "rgba(0,245,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  transition: "all 0.3s",
                  ...(dragging ? { borderColor: "var(--cyan)", background: "rgba(0,245,255,0.1)", boxShadow: "0 0 20px var(--cyan-glow)" } : {}),
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--text-bright)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                {dragging ? "Release to Upload" : "Upload Dataset Module"}
              </p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                Drag &amp; Drop · Click to Select · CSV / JSON
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--pink)", marginTop: 10, textAlign: "center" }}>
          ⚠ {error}
        </p>
      )}

      {/* Analyze button */}
      {file && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <NeonButton variant="solid-cyan" size="lg" onClick={handleAnalyze}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Run Full Analysis
          </NeonButton>
          <NeonButton variant="ghost" size="lg" onClick={() => { setFile(null); setError(null); }}>
            Clear
          </NeonButton>
        </div>
      )}

      {/* Privacy note */}
      <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)", textAlign: "center", marginTop: 20, letterSpacing: "0.08em" }}>
        // Your data is processed securely and never stored permanently.
      </p>
    </div>
  );
}
