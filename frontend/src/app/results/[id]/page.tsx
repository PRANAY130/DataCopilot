"use client";
import { use, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import CyberCard from "@/components/ui/CyberCard";
import { useAuthHeader } from "@/context/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ResultsPage({ params }: { params: Promise<{id:string}>|any }) {
  const unwrapped = params instanceof Promise ? use(params) : params;
  const sessionId = unwrapped.id;
  const authHeader = useAuthHeader();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  
  
  
  useEffect(() => {
    if (!sessionId) return;
    const headers: Record<string,string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    fetch(`${BACKEND_URL}/api/session/${sessionId}`, { headers })
      .then(r => r.json()).then(setSession).catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId, authHeader]);



  // ── Early returns (after all hooks) ──────────────────────────────────────────
  if (loading) return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh"}}>
        <div style={{fontFamily:"Fira Code, monospace",fontSize:13,color:"var(--cyan)"}}>// LOADING RESULTS...</div>
      </div>
    </main>
  );

  if (!session) return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}>
        <div style={{fontFamily:"Fira Code, monospace",fontSize:13,color:"var(--pink)"}}>// SESSION NOT FOUND</div>
        <div style={{fontFamily:"Inter, sans-serif",fontSize:14,color:"var(--text-muted)"}}>This analysis session does not exist or has expired.</div>
      </div>
    </main>
  );

  const evaluate = session?.steps?.evaluate?.data || {};
  const shap = session?.steps?.shap?.data || {};
  const task = session?.steps?.task?.data || {};
  const cmRaw:any[] = evaluate.confusion_matrix||[];
  const cm:number[][] = cmRaw.map(r => r.row ? r.row : r);
  const fpr:number[] = evaluate.roc_fpr||[];
  const metrics: any[] = evaluate.metrics || [];
  const best = metrics.find((m:any) => m.is_best) || metrics[0] || {};
  const features: any[] = shap.features || [];
  const isReg = task.task_type === "Regression";
  const isClustering = task.task_type === "Clustering";
  const isTimeSeries = task.task_type === "Time Series";
  const isDone = session?.status === "done";


  if (!isDone && metrics.length === 0) return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:40,border:"3px solid var(--border-dim)",borderTopColor:"var(--cyan)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:"Fira Code, monospace",fontSize:13,color:"var(--cyan)"}}>// ANALYSIS IN PROGRESS...</div>
        <div style={{fontFamily:"Inter, sans-serif",fontSize:13,color:"var(--text-muted)"}}>The pipeline is still running. Go back to the analysis page to track progress.</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <NeonButton href={`/analysis/${sessionId}`} variant="cyan">← Back to Pipeline</NeonButton>
      </div>
    </main>
  );

  if (isDone && metrics.length === 0) return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}>
        <div style={{fontFamily:"Fira Code, monospace",fontSize:13,color:"var(--amber)"}}>// RESULTS UNAVAILABLE</div>
        <div style={{fontFamily:"Inter, sans-serif",fontSize:14,color:"var(--text-muted)",textAlign:"center",maxWidth:400}}>The analysis completed but results could not be saved. Please start a new analysis from the upload page.</div>
        <NeonButton href="/upload" variant="ghost">Upload New Dataset</NeonButton>
      </div>
    </main>
  );

  return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{maxWidth:1300,margin:"0 auto",padding:"100px 24px 80px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:40}}>
          <div>
            <p className="section-eyebrow" style={{color:"var(--cyan)"}}>// ANALYSIS RESULTS</p>
            <h1 style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:"clamp(1.5rem,3vw,2.4rem)",color:"var(--text-bright)",marginBottom:8}}>
              {session?.filename || sessionId}
            </h1>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-muted)",border:"1px solid var(--border-faint)",padding:"3px 10px"}}>
                {session?.steps?.upload?.data?.rows} rows
              </span>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--cyan)",border:"1px solid rgba(0,245,255,0.2)",padding:"3px 10px"}}>
                {task.task_type}
              </span>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--green)",border:"1px solid rgba(0,255,136,0.2)",padding:"3px 10px"}}>
                Best: {best.model} {isClustering ? (best.silhouette ? `Sil: ${best.silhouette.toFixed(3)}` : "") : (!isReg && !isTimeSeries && best.accuracy ? `${(best.accuracy*100).toFixed(1)}%` : best.r2)}
              </span>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <NeonButton href={`/chat/${sessionId}`} variant="cyan">
              💬 Ask AI
            </NeonButton>
            <NeonButton href={`/analysis/${sessionId}`} variant="ghost">
              ← Pipeline
            </NeonButton>
          </div>
        </div>

                <div>
            {/* Metric cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"var(--border-faint)",border:"1px solid var(--border-faint)",marginBottom:28}}>
              {[
                {label:"Best Model", value: best.model || "—", color:"var(--cyan)"},
                isClustering
                  ? {label:"Silhouette", value: best.silhouette?.toFixed(4)||"—", color:"var(--green)"}
                  : {label: isReg||isTimeSeries?"R² Score":"Accuracy", value: isReg||isTimeSeries?(best.r2||"—"):best.accuracy?`${(best.accuracy*100).toFixed(1)}%`:"—", color:"var(--green)"},
                isClustering
                  ? {label:"Davies-Bouldin", value: best.davies_bouldin?.toFixed(4)||"—", color:"var(--purple)"}
                  : {label: isReg||isTimeSeries?"MAE":"ROC-AUC", value: isReg||isTimeSeries?(best.mae||"—"):(best.auc||"—"), color:"var(--purple)"},
                isClustering
                  ? {label:"Clusters", value: "—", color:"var(--pink)"}
                  : {label: isTimeSeries?"MAPE":isReg?"RMSE":"F1-Score", value: isTimeSeries?(best.mape||"—"):isReg?(best.rmse||"—"):(best.f1||"—"), color:"var(--pink)"},
              ].map(m=>(
                <div key={m.label} style={{padding:"24px 20px",background:"var(--bg-card)",textAlign:"center"}}>
                  <div style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:"1.8rem",color:m.color,marginBottom:6}}>{m.value}</div>
                  <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",letterSpacing:"0.12em",textTransform:"uppercase"}}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:24}}>
              {/* Model comparison */}
              <CyberCard noPad>
                <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-faint)"}}>
                  <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--cyan)",letterSpacing:"0.14em",textTransform:"uppercase"}}>// Model Comparison</p>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid var(--border-faint)"}}>
                      {isClustering
                        ? ["Model", "Silhouette", "Davies-Bouldin", ""].map(h=>(
                          <th key={h} style={{padding:"10px 14px",fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",textAlign:"left"}}>{h}</th>
                        ))
                        : isTimeSeries
                        ? ["Model", "R²", "MAE", "MAPE"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",textAlign:"left"}}>{h}</th>
                        ))
                        : ["Model", isReg?"R²":"Acc", isReg?"MAE":"F1", isReg?"RMSE":"AUC"].map(h=>(
                        <th key={h} style={{padding:"10px 14px",fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",textAlign:"left"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m:any)=>(
                      <tr key={m.model} style={{borderBottom:"1px solid var(--border-faint)"}}>
                        <td style={{padding:"11px 14px",fontFamily:"Rajdhani, sans-serif",fontWeight:m.is_best?700:400,fontSize:14,color:m.is_best?"var(--cyan)":"var(--text-primary)"}}>
                          {m.model} {m.is_best&&<span style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--green)",border:"1px solid var(--green)",padding:"1px 4px",marginLeft:6}}>BEST</span>}
                        </td>
                        <td style={{padding:"11px 14px",fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-primary)"}}>{isClustering?m.silhouette:(isReg||isTimeSeries?m.r2:m.accuracy?`${(m.accuracy*100).toFixed(1)}%`:"—")}</td>
                        <td style={{padding:"11px 14px",fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-primary)"}}>{isClustering?m.davies_bouldin:(isReg||isTimeSeries?m.mae:m.f1)}</td>
                        <td style={{padding:"11px 14px",fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-primary)"}}>{isClustering?"":(isTimeSeries?m.mape:(isReg?m.rmse:m.auc))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CyberCard>

              {/* SHAP */}
              {features.length > 0 && (
              <CyberCard noPad>
                <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-faint)"}}>
                  <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--purple)",letterSpacing:"0.14em",textTransform:"uppercase"}}>// SHAP Feature Importance</p>
                </div>
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
                  {features.slice(0,7).map((f:any,i:number)=>{
                    const colors=["var(--cyan)","var(--purple)","var(--pink)","var(--green)","var(--amber)","var(--cyan)","var(--purple)"];
                    const c=colors[i];
                    const max=features[0]?.importance||1;
                    return (
                      <div key={f.name}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-primary)"}}>{f.name}</span>
                          <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:c}}>{f.importance?.toFixed(4)}</span>
                        </div>
                        <div style={{height:5,background:"var(--bg-panel)",borderRadius:3}}>
                          <div style={{height:"100%",width:`${(f.importance/max)*100}%`,background:c,borderRadius:3,boxShadow:`0 0 8px ${c}80`,maxWidth:"100%"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CyberCard>
              )}
            </div>

            {/* AI Insight */}
            {session?.ai_insight && (
              <CyberCard accent="purple">
                <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                  <div style={{width:40,height:40,border:"1px solid var(--purple)",background:"rgba(191,0,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={1.5} width={20} height={20}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--purple)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// AI INSIGHT</p>
                    <p style={{fontFamily:"Inter, sans-serif",fontSize:14,color:"var(--text-muted)",lineHeight:1.7}}>{session.ai_insight}</p>
                  </div>
                </div>
              </CyberCard>
            )}
          </div>
        
      </div>
    </main>
  );
}
