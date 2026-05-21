"use client";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "@/components/ui/NeonButton";
import { useAuthHeader } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ACCEPT_TYPES = [".csv", ".json"];

const DEMO_DATASETS = [
  { id: "titanic", name: "titanic.csv", type: "Classification", rows: 891, cols: 12, size: "60.3 KB", color: "var(--cyan)", emoji: "⛵" },
  { id: "boston", name: "boston_housing.csv", type: "Regression", rows: 506, cols: 14, size: "35.2 KB", color: "var(--purple)", emoji: "🏠" },
  { id: "mall", name: "mall_customers.csv", type: "Clustering", rows: 200, cols: 5, size: "18.4 KB", color: "var(--pink)", emoji: "🛍️" },
  { id: "iris", name: "iris.csv", type: "Multi-class", rows: 150, cols: 5, size: "4.4 KB", color: "var(--green)", emoji: "🌸" },
];

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  filename: string;
}

/** Parse a CSV string into headers + rows (max 50 rows for preview) */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line: string) => {
    const result: string[] = [];
    let cur = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1, 51).map(split);
  return { headers, rows };
}

export default function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const authHeader = useAuthHeader();
  const { startSession, setUploadedFile } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json"].includes(ext ?? "")) {
      setError("Only CSV and JSON files are supported.");
      return;
    }
    // 5MB limit to prevent OOM on Render free tier
    if (f.size > 5 * 1024 * 1024) {
      setError("File exceeds the 5MB limit. Please upload a smaller dataset.");
      return;
    }
    setError(null);
    setFile(f);
    setSelectedDemoId(null);
    setPreview(null);
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
    setPreview(null);
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setSelectedDemoId(null);
    setPreview(null);
    setPreviewOpen(false);
  };

  // Read + parse the file client-side for preview
  const handleViewDataset = useCallback(async () => {
    setPreviewOpen(true);

    if (preview) return; // already loaded
    setPreviewLoading(true);

    if (selectedDemoId) {
      // Fetch the demo CSV from GitHub directly for preview
      const DEMO_URLS: Record<string, string> = {
        titanic: "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv",
        boston: "https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv",
        iris: "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv",
        mall: "https://raw.githubusercontent.com/SteffiPeTaffy/machineLearningAZ/master/Machine%20Learning%20A-Z%20Template%20Folder/Part%204%20-%20Clustering/Section%2025%20-%20Hierarchical%20Clustering/Mall_Customers.csv",
      };
      const demo = DEMO_DATASETS.find(d => d.id === selectedDemoId)!;
      try {
        const res = await fetch(DEMO_URLS[selectedDemoId]);
        const text = await res.text();
        const { headers, rows } = parseCSV(text);
        setPreview({ headers, rows, totalRows: demo.rows, filename: demo.name });
      } catch {
        setPreview({ headers: [], rows: [], totalRows: 0, filename: demo.name });
      }
    } else if (file && file.size > 0) {
      // Read real file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const ext = file.name.split(".").pop()?.toLowerCase();
        let headers: string[] = [];
        let rows: string[][] = [];
        if (ext === "json") {
          try {
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            headers = Object.keys(arr[0] || {});
            rows = arr.slice(0, 50).map((r: any) => headers.map(h => String(r[h] ?? "")));
          } catch { /* empty */ }
        } else {
          ({ headers, rows } = parseCSV(text));
        }
        setPreview({ headers, rows, totalRows: rows.length, filename: file.name });
        setPreviewLoading(false);
      };
      reader.readAsText(file);
      return;
    }
    setPreviewLoading(false);
  }, [file, selectedDemoId, preview]);

  const handleAnalyze = async () => {
    if (!file && !selectedDemoId) return;
    setUploading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers["Authorization"] = authHeader;

      let sessionId: string;

      if (selectedDemoId) {
        headers["Content-Type"] = "application/json";
        const res = await fetch(`${BACKEND_URL}/api/upload-demo`, {
          method: "POST", headers,
          body: JSON.stringify({ demo_id: selectedDemoId }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Failed to load demo");
        sessionId = (await res.json()).session_id;
      } else if (file) {
        // Read file client-side as text first
        const fileContent = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = (e) => resolve(e.target?.result as string);
          r.onerror = () => reject(new Error("Failed to read file client-size."));
          r.readAsText(file);
        });

        // Store the file content in context before initiating session
        setUploadedFile(file.name, fileContent);

        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", headers, body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Upload failed");
        sessionId = (await res.json()).session_id;
      } else { return; }

      setPreviewOpen(false);
      router.push(`/analysis/${sessionId}?mode=${mode}`);
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

        .preview-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px); z-index: 1000;
          display: flex; align-items: flex-end; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .preview-panel {
          width: 100%; max-width: 1200px;
          background: rgba(4, 4, 18, 0.98);
          border: 1px solid rgba(0,245,255,0.25);
          border-bottom: none;
          max-height: 75vh;
          display: flex; flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 -12px 60px rgba(0,245,255,0.08);
        }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .preview-table { width: 100%; border-collapse: collapse; font-family: "Fira Code", monospace; font-size: 11px; }
        .preview-table th {
          padding: 10px 14px; text-align: left; white-space: nowrap;
          border-bottom: 1px solid rgba(0,245,255,0.2);
          color: var(--cyan); font-weight: 600; letter-spacing: 0.05em;
          background: rgba(0,245,255,0.04); position: sticky; top: 0;
        }
        .preview-table td {
          padding: 8px 14px; color: var(--text-primary);
          border-bottom: 1px solid var(--border-faint); white-space: nowrap;
          max-width: 180px; overflow: hidden; text-overflow: ellipsis;
        }
        .preview-table tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ borderRadius: 0, padding: "70px 40px", cursor: file ? "default" : "pointer" }}
      >
        <input ref={inputRef} type="file" accept={ACCEPT_TYPES.join(",")} style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* Corner decorations */}
        {[{s:{top:0,left:0},bt:1,bl:1},{s:{top:0,right:0},bt:1,br:1},{s:{bottom:0,left:0},bb:1,bl:1},{s:{bottom:0,right:0},bb:1,br:1}].map((c,i)=>(
          <div key={i} style={{ position:"absolute",...c.s,width:20,height:20,
            borderColor:dragging?"var(--cyan)":"rgba(0,245,255,0.4)",
            borderTopWidth:c.bt?1:0,borderBottomWidth:c.bb?1:0,
            borderLeftWidth:c.bl?1:0,borderRightWidth:c.br?1:0,
            borderStyle:"solid",transition:"border-color 0.3s" }} />
        ))}

        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          {file ? (
            <>
              <div style={{ width:64,height:64,border:"1px solid var(--green)",background:"rgba(0,255,136,0.08)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p style={{ fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:18,color:"var(--green)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8 }}>
                {selectedDemoId ? "Demo Dataset Selected" : "Dataset Ready"}
              </p>
              <p style={{ fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-muted)" }}>{file.name}</p>
            </>
          ) : (
            <>
              <div style={{ width:64,height:64,border:"1px solid rgba(0,245,255,0.25)",background:"rgba(0,245,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",transition:"all 0.3s",...(dragging?{borderColor:"var(--cyan)",background:"rgba(0,245,255,0.1)"}:{}) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth={1.5} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>
              <p style={{ fontFamily:"Rajdhani, sans-serif",fontWeight:600,fontSize:18,color:"var(--text-bright)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8 }}>
                {dragging ? "Release to Upload" : "Upload Dataset"}
              </p>
              <p style={{ fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-muted)" }}>
                Drag & Drop · Click to Select · CSV / JSON
              </p>
            </>
          )}
        </div>
      </div>

      {/* Demo selection */}
      {!file && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
            <span style={{ fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--cyan)",letterSpacing:"0.1em" }}>// OR SELECT A DEMO DATASET</span>
            <div style={{ flex:1,height:1,background:"rgba(0,245,255,0.15)" }} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:12 }}>
            {DEMO_DATASETS.map((demo) => (
              <div key={demo.id} onClick={() => handleSelectDemo(demo)}
                className={`demo-card demo-card-${demo.id} ${selectedDemoId === demo.id ? "active" : ""}`}>
                <div style={{ position:"absolute",top:-1,left:-1,width:8,height:8,borderTop:`1px solid ${demo.color}`,borderLeft:`1px solid ${demo.color}` }} />
                <div style={{ position:"absolute",bottom:-1,right:-1,width:8,height:8,borderBottom:`1px solid ${demo.color}`,borderRight:`1px solid ${demo.color}` }} />
                <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                  <div style={{ width:36,height:36,border:`1px solid ${demo.color}30`,background:`${demo.color}08`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{demo.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2 }}>
                      <h4 style={{ fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:14,color:"var(--text-bright)" }}>{demo.name}</h4>
                      <span style={{ fontFamily:"Fira Code, monospace",fontSize:9,color:demo.color,border:`1px solid ${demo.color}30`,padding:"1px 6px",marginLeft:6,flexShrink:0 }}>{demo.type}</span>
                    </div>
                    <div style={{ fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)" }}>{demo.rows} rows · {demo.cols} cols · {demo.size}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--pink)",marginTop:12,textAlign:"center" }}>⚠ {error}</p>
      )}

      {/* Action buttons — shown after file/demo selected */}
      {file && (
        <>
          {/* Mode Toggle Selection */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24, marginBottom: 12 }}>
            <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
              // Execution Mode
            </span>
            <div style={{ display: "flex", border: "1px solid rgba(0,245,255,0.25)", padding: 2, background: "rgba(4,4,16,0.8)", position: "relative" }}>
              <button
                onClick={() => setMode("auto")}
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "6px 18px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  background: mode === "auto" ? "var(--cyan)" : "transparent",
                  color: mode === "auto" ? "black" : "var(--text-muted)",
                  boxShadow: mode === "auto" ? "0 0 15px rgba(0,245,255,0.4)" : "none",
                }}
              >
                Auto Mode
              </button>
              <button
                onClick={() => setMode("manual")}
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "6px 18px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  background: mode === "manual" ? "var(--cyan)" : "transparent",
                  color: mode === "manual" ? "black" : "var(--text-muted)",
                  boxShadow: mode === "manual" ? "0 0 15px rgba(0,245,255,0.4)" : "none",
                }}
              >
                Manual Mode
              </button>
            </div>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)", marginTop: 8, textAlign: "center", maxWidth: 440, lineHeight: 1.4 }}>
              {mode === "auto" 
                ? "Pipeline runs end-to-end automatically with standard configurations."
                : "Pipeline pauses at Task Detection, Preprocessing, and Model Selection steps to let you customize settings."
              }
            </p>
          </div>

          <div style={{ display:"flex",gap:10,justifyContent:"center",marginTop:16,flexWrap:"wrap" }}>
          <NeonButton variant="solid-cyan" size="lg" onClick={handleAnalyze} disabled={uploading}>
            {uploading ? (
              <><span style={{ width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.6s linear infinite",display:"inline-block" }} />Initializing...</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>Run Full Analysis</>
            )}
          </NeonButton>

          <NeonButton variant="cyan" size="lg" onClick={handleViewDataset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            View Dataset
          </NeonButton>

          <NeonButton variant="ghost" size="lg" onClick={() => inputRef.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Change
          </NeonButton>

          <NeonButton variant="ghost" size="lg" onClick={handleClear}>✕ Clear</NeonButton>
        </div>
      </>
    )}

      <p style={{ fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-dim)",textAlign:"center",marginTop:24,letterSpacing:"0.08em" }}>
        // Files are processed in-memory and never permanently stored
      </p>

      {/* ── DATASET PREVIEW PANEL ────────────────────────────────────────────── */}
      {previewOpen && (
        <div className="preview-overlay" onClick={(e) => e.target === e.currentTarget && setPreviewOpen(false)}>
          <div className="preview-panel">
            {/* Panel header */}
            <div style={{ padding:"14px 20px",borderBottom:"1px solid rgba(0,245,255,0.15)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--cyan)",letterSpacing:"0.15em" }}>// DATASET PREVIEW</span>
                {preview && (
                  <>
                    <span style={{ fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-muted)" }}>{preview.filename}</span>
                    <span style={{ fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-dim)",border:"1px solid var(--border-faint)",padding:"1px 8px" }}>
                      {preview.headers.length} cols · showing first {preview.rows.length} of {preview.totalRows} rows
                    </span>
                  </>
                )}
              </div>
              <button onClick={() => setPreviewOpen(false)}
                style={{ background:"transparent",border:"1px solid var(--border-faint)",color:"var(--text-muted)",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--pink)";e.currentTarget.style.color="var(--pink)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border-faint)";e.currentTarget.style.color="var(--text-muted)"}}>
                ✕
              </button>
            </div>

            {/* Table body */}
            <div style={{ overflowY:"auto",flex:1 }}>
              {previewLoading ? (
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0" }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <div className="pulse-dot" style={{ backgroundColor:"var(--cyan)",width:8,height:8 }} />
                    <span style={{ fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--cyan)" }}>Loading preview...</span>
                  </div>
                </div>
              ) : !preview || preview.headers.length === 0 ? (
                <div style={{ textAlign:"center",padding:"60px 0",fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-muted)" }}>
                  Could not parse file. It will still be analyzed by the backend.
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th style={{ color:"var(--text-dim)",width:40,textAlign:"center" }}>#</th>
                        {preview.headers.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i}>
                          <td style={{ color:"var(--text-dim)",textAlign:"center" }}>{i + 1}</td>
                          {row.map((cell, j) => (
                            <td key={j} title={cell}
                              style={{ color: isNaN(Number(cell)) || cell === "" ? "var(--text-primary)" : "var(--cyan)" }}>
                              {cell === "" ? <span style={{ color:"var(--text-dim)",fontStyle:"italic" }}>null</span> : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding:"12px 20px",borderTop:"1px solid var(--border-faint)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"rgba(0,0,0,0.3)" }}>
              <span style={{ fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-dim)" }}>
                Numeric values highlighted in cyan · null values shown in italic
              </span>
              <div style={{ display:"flex",gap:10 }}>
                <NeonButton variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>Close</NeonButton>
                <NeonButton variant="solid-cyan" size="sm" onClick={() => { setPreviewOpen(false); handleAnalyze(); }} disabled={uploading}>
                  Run Analysis
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
