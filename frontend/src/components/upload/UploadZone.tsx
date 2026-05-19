"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "@/components/ui/NeonButton";
import { useAuthHeader } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ACCEPT_TYPES = [".csv", ".json"];

const DEMO_DATASETS = [
  { id: "titanic", name: "titanic.csv", type: "Classification", rows: 891, cols: 12, size: "60.3 KB", color: "var(--cyan)", glowColor: "rgba(0, 245, 255, 0.4)" },
  { id: "boston", name: "boston_housing.csv", type: "Regression", rows: 506, cols: 14, size: "35.2 KB", color: "var(--purple)", glowColor: "rgba(191, 0, 255, 0.4)" },
  { id: "mall", name: "mall_customers.csv", type: "Clustering", rows: 200, cols: 5, size: "18.4 KB", color: "var(--pink)", glowColor: "rgba(255, 0, 102, 0.4)" },
  { id: "iris", name: "iris.csv", type: "Multi-class", rows: 150, cols: 5, size: "4.4 KB", color: "var(--green)", glowColor: "rgba(0, 255, 136, 0.4)" },
];

export default function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const authHeader = useAuthHeader();
  const { startSession } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json"].includes(ext ?? "")) {
      setError("Only CSV and JSON files are supported.");
      return;
    }
    setError(null);
    setFile(f);
    setSelectedDemoId(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSelectDemo = (demo: typeof DEMO_DATASETS[0]) => {
    setSelectedDemoId(demo.id);
    setFile({ name: demo.name } as File);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file && !selectedDemoId) return;
    setUploading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers["Authorization"] = authHeader;

      let sessionId: string;

      if (selectedDemoId) {
        // Demo dataset
        headers["Content-Type"] = "application/json";
        const res = await fetch(`${BACKEND_URL}/api/upload-demo`, {
          method: "POST",
          headers,
          body: JSON.stringify({ demo_id: selectedDemoId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load demo dataset");
        }
        const data = await res.json();
        sessionId = data.session_id;
      } else if (file) {
        // Real file upload
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          headers,
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Upload failed");
        }
        const data = await res.json();
        sessionId = data.session_id;
      } else {
        return;
      }

      // Pre-start session state then navigate
      router.push(`/analysis/${sessionId}`);
    } catch (e: any) {
      setError(e.message || "Connection failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        .demo-card { border: 1px solid var(--border-faint); background: rgba(4,4,16,0.7); padding: 16px; cursor: pointer; transition: all 0.28s cubic-bezier(0.2,0.8,0.2,1); position: relative; }
        .demo-card:hover { background: rgba(255,255,255,0.04) !important; transform: translateY(-4px) !important; }
        .demo-card-titanic:hover { border-color: var(--cyan) !important; box-shadow: 0 0 28px rgba(0,245,255,0.4), inset 0 0 16px rgba(0,245,255,0.07) !important; }
        .demo-card-boston:hover { border-color: var(--purple) !important; box-shadow: 0 0 28px rgba(191,0,255,0.4), inset 0 0 16px rgba(191,0,255,0.07) !important; }
        .demo-card-mall:hover { border-color: var(--pink) !important; box-shadow: 0 0 28px rgba(255,0,102,0.4), inset 0 0 16px rgba(255,0,102,0.07) !important; }
        .demo-card-iris:hover { border-color: var(--green) !important; box-shadow: 0 0 28px rgba(0,255,136,0.4), inset 0 0 16px rgba(0,255,136,0.07) !important; }
        .demo-card.active { border-color: var(--cyan) !important; box-shadow: 0 0 28px rgba(0,245,255,0.35), inset 0 0 16px rgba(0,245,255,0.07) !important; }
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
        {[
          { pos: "top-0 left-0", s: { top: 0, left: 0 }, bt: 1, bl: 1 },
          { pos: "top-0 right-0", s: { top: 0, right: 0 }, bt: 1, br: 1 },
          { pos: "bottom-0 left-0", s: { bottom: 0, left: 0 }, bb: 1, bl: 1 },
          { pos: "bottom-0 right-0", s: { bottom: 0, right: 0 }, bb: 1, br: 1 },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", ...c.s, width: 20, height: 20,
            borderColor: dragging ? "var(--cyan)" : "rgba(0,245,255,0.4)",
            borderTopWidth: c.bt ? 1 : 0, borderBottomWidth: c.bb ? 1 : 0,
            borderLeftWidth: c.bl ? 1 : 0, borderRightWidth: c.br ? 1 : 0,
            borderStyle: "solid", transition: "border-color 0.3s",
          }} />
        ))}

        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          {file ? (
            <>
              <div style={{ width: 64, height: 64, border: "1px solid var(--green)", background: "rgba(0,255,136,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--green)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                {selectedDemoId ? "Demo Dataset Selected" : "Dataset Ready"}
              </p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>{file.name}</p>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, border: "1px solid rgba(0,245,255,0.25)", background: "rgba(0,245,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", transition: "all 0.3s", ...(dragging ? { borderColor: "var(--cyan)", background: "rgba(0,245,255,0.1)" } : {}) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--text-bright)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                {dragging ? "Release to Upload" : "Upload Dataset"}
              </p>
              <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--text-muted)" }}>
                Drag & Drop · Click to Select · CSV / JSON
              </p>
            </>
          )}
        </div>
      </div>

      {/* Demo dataset selection */}
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
                <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: `1px solid ${demo.color}`, borderLeft: `1px solid ${demo.color}` }} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: `1px solid ${demo.color}`, borderRight: `1px solid ${demo.color}` }} />
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, border: `1px solid ${demo.color}30`, background: `${demo.color}08`, display: "flex", alignItems: "center", justifyContent: "center", color: demo.color, fontFamily: "Fira Code, monospace", fontSize: 16, flexShrink: 0 }}>
                    {demo.id === "titanic" ? "⛵" : demo.id === "boston" ? "🏠" : demo.id === "mall" ? "🛍️" : "🌸"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <h4 style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-bright)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{demo.name}</h4>
                      <span style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: demo.color, border: `1px solid ${demo.color}30`, padding: "1px 6px", marginLeft: 6, flexShrink: 0 }}>{demo.type}</span>
                    </div>
                    <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)" }}>{demo.rows} rows · {demo.cols} cols · {demo.size}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "var(--pink)", marginTop: 12, textAlign: "center" }}>
          ⚠ {error}
        </p>
      )}

      {file && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <NeonButton variant="solid-cyan" size="lg" onClick={handleAnalyze} disabled={uploading}>
            {uploading ? (
              <>
                <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                Initializing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Run Full Analysis
              </>
            )}
          </NeonButton>
          <NeonButton variant="ghost" size="lg" onClick={() => { setFile(null); setError(null); setSelectedDemoId(null); }}>
            Clear
          </NeonButton>
        </div>
      )}

      <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)", textAlign: "center", marginTop: 24, letterSpacing: "0.08em" }}>
        // Files are processed in-memory and never permanently stored
      </p>
    </div>
  );
}
