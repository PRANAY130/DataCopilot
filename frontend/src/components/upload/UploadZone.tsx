"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "@/components/ui/NeonButton";

const ACCEPT_TYPES = [".csv", ".json"];

const DEMO_DATASETS = [
  {
    id: "titanic",
    name: "titanic.csv",
    type: "Classification",
    rows: 891,
    cols: 12,
    size: "60.3 KB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    color: "var(--cyan)",
    glowColor: "rgba(0, 245, 255, 0.4)",
  },
  {
    id: "boston",
    name: "boston_housing.csv",
    type: "Regression",
    rows: 506,
    cols: 14,
    size: "35.2 KB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    color: "var(--purple)",
    glowColor: "rgba(191, 0, 255, 0.4)",
  },
  {
    id: "mall",
    name: "mall_customers.json",
    type: "Clustering",
    rows: 200,
    cols: 5,
    size: "18.4 KB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
    color: "var(--pink)",
    glowColor: "rgba(255, 0, 102, 0.4)",
  },
  {
    id: "sales",
    name: "store_sales.csv",
    type: "Forecasting",
    rows: 1042,
    cols: 8,
    size: "88.1 KB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={20} height={20}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    color: "var(--green)",
    glowColor: "rgba(0, 255, 136, 0.4)",
  },
];

interface UploadZoneProps {
  onFileSelected?: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json"].includes(ext ?? "")) {
      setError("Only CSV and JSON files are supported.");
      return;
    }
    setError(null);
    setFile(f);
    setSelectedDemoId(null);
    onFileSelected?.(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSelectDemo = (demo: typeof DEMO_DATASETS[0]) => {
    // Generate a mock file to simulate normal file upload flow
    const blob = new Blob(["demo dataset content"], { type: "text/csv" });
    const mockFile = new File([blob], demo.name, { type: "text/csv" });
    setFile(mockFile);
    setSelectedDemoId(demo.id);
    setError(null);
    onFileSelected?.(mockFile);
  };

  const handleAnalyze = () => {
    if (!file) return;
    // Direct analysis navigation
    const targetId = selectedDemoId || "demo";
    router.push(`/analysis/${targetId}`);
  };

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        .demo-card {
          border: 1px solid var(--border-faint);
          background: rgba(4, 4, 16, 0.7);
          padding: 16px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
        }
        .demo-card:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          transform: translateY(-5px) !important;
        }
        
        .demo-card-titanic:hover {
          border-color: var(--cyan) !important;
          box-shadow: 
            0 0 30px rgba(0, 245, 255, 0.45),
            0 0 60px rgba(0, 245, 255, 0.18),
            inset 0 0 18px rgba(0, 245, 255, 0.08) !important;
        }
        
        .demo-card-boston:hover {
          border-color: var(--purple) !important;
          box-shadow: 
            0 0 30px rgba(191, 0, 255, 0.45),
            0 0 60px rgba(191, 0, 255, 0.18),
            inset 0 0 18px rgba(191, 0, 255, 0.08) !important;
        }
        
        .demo-card-mall:hover {
          border-color: var(--pink) !important;
          box-shadow: 
            0 0 30px rgba(255, 0, 102, 0.45),
            0 0 60px rgba(255, 0, 102, 0.18),
            inset 0 0 18px rgba(255, 0, 102, 0.08) !important;
        }
        
        .demo-card-sales:hover {
          border-color: var(--green) !important;
          box-shadow: 
            0 0 30px rgba(0, 255, 136, 0.45),
            0 0 60px rgba(0, 255, 136, 0.18),
            inset 0 0 18px rgba(0, 255, 136, 0.08) !important;
        }

        .demo-card.active {
          background: rgba(0, 245, 255, 0.04) !important;
          border-color: var(--cyan) !important;
          box-shadow: 
            0 0 30px rgba(0, 245, 255, 0.35),
            0 0 70px rgba(0, 245, 255, 0.15),
            inset 0 0 20px rgba(0, 245, 255, 0.08) !important;
        }
      `}</style>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ borderRadius: 0, padding: "70px 40px" }}
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
                {selectedDemoId ? "Demo Dataset Loaded" : "Dataset Loaded"}
              </p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{file.name}</p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-dim)" }}>
                {selectedDemoId ? "Demo File" : `${(file.size / 1024).toFixed(1)} KB`}
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

      {/* DEMO DATASET SELECTION */}
      {!file && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--cyan)", letterSpacing: "0.1em" }}>// OR SELECT A DEMO DATASET</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,245,255,0.15)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {DEMO_DATASETS.map((demo) => (
              <div
                key={demo.id}
                onClick={() => handleSelectDemo(demo)}
                className={`demo-card demo-card-${demo.id} ${selectedDemoId === demo.id ? "active" : ""}`}
              >
                {/* Corners */}
                <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: `1px solid ${demo.color}`, borderLeft: `1px solid ${demo.color}` }} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: `1px solid ${demo.color}`, borderRight: `1px solid ${demo.color}` }} />

                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 38, height: 38,
                    border: `1px solid ${demo.color}30`,
                    background: `${demo.color}08`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: demo.color,
                    flexShrink: 0,
                  }}>
                    {demo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {demo.name}
                      </h4>
                      <span style={{
                        fontFamily: "Fira Code, monospace", fontSize: 9,
                        color: demo.color,
                        border: `1px solid ${demo.color}30`,
                        padding: "1px 6px",
                        borderRadius: 2,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginLeft: 6,
                        flexShrink: 0,
                      }}>
                        {demo.type}
                      </span>
                    </div>
                    <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)" }}>
                      {demo.rows} rows · {demo.cols} cols · {demo.size}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--pink)", marginTop: 10, textAlign: "center" }}>
          ⚠ {error}
        </p>
      )}

      {/* Analyze button */}
      {file && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <NeonButton variant="solid-cyan" size="lg" onClick={handleAnalyze}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Run Full Analysis
          </NeonButton>
          <NeonButton variant="ghost" size="lg" onClick={() => { setFile(null); setError(null); setSelectedDemoId(null); }}>
            Clear
          </NeonButton>
        </div>
      )}

      {/* Privacy note */}
      <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)", textAlign: "center", marginTop: 24, letterSpacing: "0.08em" }}>
        // Select a premium preset or drag a private document. Processing is secured.
      </p>
    </div>
  );
}
