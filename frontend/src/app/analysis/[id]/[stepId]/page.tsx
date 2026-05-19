"use client";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import StepTracker from "@/components/analysis/StepTracker";
import { useSession } from "@/context/SessionContext";
import { useAuthHeader } from "@/context/AuthContext";

const STEP_IDS = ["upload","analyze","task","preprocess","recommend","train","evaluate","shap","viz"];
const STEP_LABELS: Record<string,string> = {
  upload:"Dataset Ingest", analyze:"Data Profile", task:"Task Detection",
  preprocess:"Data Prep", recommend:"Model Selection", train:"Model Training",
  evaluate:"Evaluation", shap:"SHAP Explainability", viz:"Visualizations",
};
const ACCENT: Record<string,string> = {
  upload:"var(--cyan)", analyze:"var(--cyan)", task:"var(--amber)",
  preprocess:"var(--pink)", recommend:"var(--green)", train:"var(--purple)",
  evaluate:"var(--green)", shap:"var(--pink)", viz:"var(--cyan)",
};

export default function StepDetailPage({ params }: { params: Promise<{id:string;stepId:string}>|any }) {
  const router = useRouter();
  const authHeader = useAuthHeader();
  const { session, startSession } = useSession();
  const unwrapped = params instanceof Promise ? use(params) : params;
  const { id: sessionId, stepId } = unwrapped;
  const accent = ACCENT[stepId] || "var(--cyan)";

  useEffect(() => {
    if (sessionId && !session?.sessionId) {
      startSession(sessionId, authHeader ? authHeader.replace("Bearer ","") : null);
    }
  }, [sessionId]);

  const steps = STEP_IDS.map(id => ({
    id, label: STEP_LABELS[id],
    status: session?.steps[id]?.status || "pending" as const,
    detail: undefined,
  }));

  const stepData = session?.steps[stepId]?.data || {};
  const done = session?.status === "done";

  return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{maxWidth:1300,margin:"0 auto",padding:"100px 24px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <span onClick={()=>router.push(`/analysis/${sessionId}`)}
                style={{cursor:"pointer",fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--cyan)",textDecoration:"underline"}}>
                &lt;- Back to Pipeline
              </span>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-dim)"}}>· {sessionId}</span>
            </div>
            <h1 style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:"clamp(1.4rem,3vw,2rem)",color:"var(--text-bright)"}}>
              {STEP_LABELS[stepId]}
            </h1>
          </div>
          <div style={{display:"flex",gap:12}}>
            <NeonButton onClick={()=>router.push(`/analysis/${sessionId}`)} variant="cyan" size="sm">Overview</NeonButton>
            {done && <NeonButton href={`/results/${sessionId}`} variant="solid-cyan" size="sm">View Results</NeonButton>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:28}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{border:"1px dashed rgba(0,245,255,0.2)",padding:"10px 14px"}}>
              <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--cyan)",margin:0}}>
                // INSPECT MODE
              </p>
            </div>
            <StepTracker steps={steps} selectedStepId={stepId}
              onStepSelect={id=>router.push(`/analysis/${sessionId}/${id}`)} />
          </div>

          <div style={{border:`1px solid ${accent}`,background:"var(--bg-card)",padding:28,position:"relative",boxShadow:`0 0 30px ${accent}08`}}>
            <div style={{position:"absolute",top:-1,left:-1,width:16,height:16,borderTop:`2px solid ${accent}`,borderLeft:`2px solid ${accent}`}}/>
            <div style={{position:"absolute",bottom:-1,right:-1,width:16,height:16,borderBottom:`2px solid ${accent}`,borderRight:`2px solid ${accent}`}}/>
            <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>// STEP DETAILS</p>
            <h2 style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:20,color:"var(--text-bright)",marginBottom:20}}>
              {STEP_LABELS[stepId]}
            </h2>
            <StepContent stepId={stepId} data={stepData} accent={accent} session={session} />
          </div>
        </div>
      </div>
    </main>
  );
}

function StepContent({stepId,data,accent,session}:{stepId:string;data:any;accent:string;session:any}) {
  const noData = !data || Object.keys(data).length===0;
  if(noData) return (
    <div style={{textAlign:"center",padding:"60px 0",color:"var(--text-muted)",fontFamily:"Fira Code, monospace",fontSize:13}}>
      <div className="pulse-dot" style={{backgroundColor:accent,width:8,height:8,margin:"0 auto 16px"}}/>
      Processing... Data will appear when step completes.
    </div>
  );

  switch(stepId) {
    case "upload": return <UploadView data={data} accent={accent}/>;
    case "analyze": return <AnalyzeView data={data} accent={accent}/>;
    case "task": return <TaskView data={data} accent={accent}/>;
    case "preprocess": return <PreprocessView data={data} accent={accent}/>;
    case "recommend": return <RecommendView data={data} accent={accent}/>;
    case "train": return <TrainView data={data} accent={accent} session={session}/>;
    case "evaluate": return <EvaluateView data={data} accent={accent}/>;
    case "shap": return <ShapView data={data} accent={accent}/>;
    case "viz": return <VizView data={data} accent={accent} session={session}/>;
    default: return <pre style={{color:"var(--text-muted)",fontSize:11}}>{JSON.stringify(data,null,2)}</pre>;
  }
}

function Card({children,style}:{children:any;style?:any}) {
  return <div style={{border:"1px solid var(--border-faint)",background:"rgba(255,255,255,0.01)",padding:14,...style}}>{children}</div>;
}

function UploadView({data,accent}:{data:any;accent:string}) {
  const cols = data.columns||[];
  const rows = data.preview_rows||[];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[["Rows",data.rows?.toLocaleString()],["Columns",data.cols],["File",data.filename]].map(([l,v])=>(
          <Card key={l as string}><div style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",marginBottom:4}}>{l}</div>
          <div style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:16,color:accent}}>{v}</div></Card>
        ))}
      </div>
      {rows.length>0 && (
        <div style={{overflowX:"auto",border:"1px solid var(--border-faint)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Fira Code, monospace",fontSize:11}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border-dim)",background:"rgba(255,255,255,0.02)"}}>
                {cols.slice(0,8).map((c:string)=><th key={c} style={{padding:"8px 12px",color:accent,textAlign:"left",whiteSpace:"nowrap"}}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0,8).map((row:any,i:number)=>(
                <tr key={i} style={{borderBottom:"1px solid var(--border-faint)"}}>
                  {cols.slice(0,8).map((c:string)=><td key={c} style={{padding:"8px 12px",color:"var(--text-primary)"}}>{String(row[c]??"")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyzeView({data,accent}:{data:any;accent:string}) {
  const cols:any[] = data.per_column||[];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <p style={{fontFamily:"Inter, sans-serif",fontSize:13,color:"var(--text-muted)",marginBottom:8}}>
        Profiled {cols.length} columns · {data.duplicate_rows} duplicate rows detected.
      </p>
      {cols.map((col:any)=>(
        <Card key={col.name}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-bright)",fontWeight:600}}>{col.name}</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-dim)"}}>{col.dtype}</span>
              <span style={{fontFamily:"Fira Code, monospace",fontSize:10,color:col.null_pct>0?"var(--amber)":"var(--green)"}}>
                {col.null_pct}% null
              </span>
            </div>
          </div>
          {col.null_pct>0 && (
            <div style={{height:4,background:"#050510",borderRadius:2}}>
              <div style={{height:"100%",width:`${Math.min(col.null_pct,100)}%`,background:col.null_pct>50?"var(--pink)":"var(--amber)",borderRadius:2}}/>
            </div>
          )}
          {col.min!=null && <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",marginTop:4}}>min: {col.min} · max: {col.max} · mean: {col.mean}</div>}
          {col.top_values && <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",marginTop:4}}>{Object.entries(col.top_values).slice(0,3).map(([k,v])=>`${k}(${v})`).join(" · ")}</div>}
        </Card>
      ))}
    </div>
  );
}

function TaskView({data,accent}:{data:any;accent:string}) {
  const counts = data.class_counts||{};
  const total = Object.values(counts).reduce((a:any,b:any)=>a+b,0) as number;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
        {[["Task Type",data.task_type],["Target Column",data.target_col]].map(([l,v])=>(
          <Card key={l as string}><div style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",marginBottom:4}}>{l}</div>
          <div style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:15,color:accent}}>{v}</div></Card>
        ))}
      </div>
      {Object.keys(counts).length>0 && (
        <div>
          <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,letterSpacing:"0.12em",marginBottom:12}}>CLASS DISTRIBUTION</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(counts).map(([cls,cnt]:any,i)=>{
              const colors=["var(--cyan)","var(--pink)","var(--purple)","var(--amber)","var(--green)"];
              const c=colors[i%colors.length];
              const pct=total>0?Math.round((cnt/total)*100):0;
              return (
                <div key={cls}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-bright)"}}>{cls}</span>
                    <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:c}}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{height:8,background:"#050510",borderRadius:4}}>
                    <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:4,boxShadow:`0 0 8px ${c}`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PreprocessView({data,accent}:{data:any;accent:string}) {
  const transforms:any[] = data.transforms||[];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
        {[["Before",`${data.shape_before?.rows} × ${data.shape_before?.cols}`],["After",`${data.shape_after?.rows} × ${data.shape_after?.cols}`]].map(([l,v])=>(
          <Card key={l as string}><div style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",marginBottom:4}}>{l}</div>
          <div style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:15,color:accent}}>{v}</div></Card>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {transforms.map((t:any,i:number)=>(
          <Card key={i}>
            <div style={{fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:14,color:accent,marginBottom:2}}>{t.action}</div>
            <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",marginBottom:2}}>Column: {t.column}</div>
            <div style={{fontFamily:"Inter, sans-serif",fontSize:12,color:"var(--text-primary)"}}>{t.detail}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RecommendView({data,accent}:{data:any;accent:string}) {
  const models:any[] = data.models||[];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {models.map((m:any)=>(
        <Card key={m.id}>
          <h4 style={{fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:15,color:accent,marginBottom:4}}>{m.name}</h4>
          <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)",marginBottom:6}}>
            {Object.entries(m.params||{}).map(([k,v])=>`${k}=${v}`).join(" · ")}
          </div>
          <p style={{fontFamily:"Inter, sans-serif",fontSize:12,color:"var(--text-primary)"}}>{m.reason}</p>
        </Card>
      ))}
    </div>
  );
}


function TrainView({data,accent,session}:{data:any;accent:string;session:any}) {
  const [tab, setTab] = useState("xgboost");

  // Logs come from:
  // 1. data.logs  — persisted in the "done" event (always available for completed sessions)
  // 2. session.steps.train.data.logs — live-streaming during the run
  const logsSource = data.logs || session?.steps?.train?.data?.logs || {};
  const logs: string[] = logsSource[tab] || [];

  const MODELS = [
    {id:"xgboost",name:"XGBoost"},
    {id:"rf",name:"RandForest"},
    {id:"logreg",name:"LogReg"},
    {id:"linear",name:"Linear"},
    {id:"svm",name:"SVM"},
  ];
  const cv: Record<string,any> = data.cv_results || {};
  const activeTabs = MODELS.filter(m => cv[m.id]);

  return (
    <div>
      {/* Model tabs — only show models that have CV results */}
      {activeTabs.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:`repeat(${activeTabs.length},1fr)`,gap:1,background:"var(--border-faint)",border:"1px solid var(--border-faint)",marginBottom:16}}>
          {activeTabs.map(m => (
            <div key={m.id} onClick={()=>setTab(m.id)}
              style={{padding:"10px",background:tab===m.id?"rgba(255,255,255,0.03)":"var(--bg-card)",borderBottom:tab===m.id?`2px solid ${accent}`:"2px solid transparent",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:13,color:tab===m.id?"var(--text-bright)":"var(--text-muted)"}}>{m.name}</div>
              <div style={{fontFamily:"Fira Code, monospace",fontSize:9,color:tab===m.id?accent:"var(--text-dim)"}}>{cv[m.id].mean}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log terminal */}
      <div style={{background:"#030308",border:"1px solid var(--border-dim)",padding:"16px 20px",height:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        {logs.length === 0 ? (
          // CV scores table fallback when logs not available
          activeTabs.length > 0 ? (
            <div style={{display:"flex",flexDirection:"column",gap:8,padding:"8px 0"}}>
              <div style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,letterSpacing:"0.12em",marginBottom:8}}>// CROSS-VALIDATION RESULTS</div>
              {activeTabs.map(m => {
                const res = cv[m.id];
                const folds: number[] = res.folds || [];
                const mean: number = res.mean || 0;
                const best = mean === Math.max(...activeTabs.map(x => cv[x.id]?.mean || 0));
                return (
                  <div key={m.id} style={{borderBottom:"1px solid var(--border-faint)",paddingBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontFamily:"Rajdhani, sans-serif",fontWeight:700,fontSize:14,color:best?"var(--green)":"var(--text-bright)"}}>
                        {m.name} {best && <span style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--green)",border:"1px solid var(--green)",padding:"1px 4px",marginLeft:4}}>BEST</span>}
                      </span>
                      <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:best?"var(--green)":accent}}>mean: {mean}</span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {folds.map((s,i) => (
                        <span key={i} style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)"}}>
                          fold{i+1}: <span style={{color:"var(--text-primary)"}}>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div className="pulse-dot" style={{backgroundColor:accent,width:6,height:6}} />
              <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-muted)"}}>Waiting for training logs...</span>
            </div>
          )
        ) : (
          logs.map((log:string,i:number) => (
            <div key={i} style={{
              fontFamily:"Fira Code, monospace",fontSize:12,lineHeight:1.5,
              color: log.includes("✓") ? "var(--green)" :
                     log.includes("Fold") ? "var(--text-primary)" :
                     "var(--cyan)"
            }}>{log}</div>
          ))
        )}
      </div>
    </div>
  );
}



function EvaluateView({data,accent}:{data:any;accent:string}) {
  const metrics:any[] = data.metrics||[];
  const isReg = data.task_type==="Regression";
  const cm:number[][] = data.confusion_matrix||[];
  const fpr:number[] = data.roc_fpr||[];
  const tpr:number[] = data.roc_tpr||[];
  return (
    <div>
      <div style={{overflowX:"auto",border:"1px solid var(--border-faint)",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Fira Code, monospace",fontSize:11}}>
          <thead>
            <tr style={{borderBottom:"1px solid var(--border-dim)",background:"rgba(255,255,255,0.02)"}}>
              {["Model",isReg?"R²":"Accuracy",isReg?"MAE":"F1",isReg?"RMSE":"AUC"].map(h=>(
                <th key={h} style={{padding:"10px 12px",color:accent,textAlign:"left"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m:any)=>(
              <tr key={m.model} style={{borderBottom:"1px solid var(--border-faint)",background:m.is_best?"rgba(0,255,136,0.03)":"none"}}>
                <td style={{padding:"10px 12px",color:m.is_best?"var(--green)":"var(--text-primary)",fontFamily:"Rajdhani, sans-serif",fontWeight:m.is_best?700:400}}>
                  {m.model} {m.is_best&&<span style={{fontSize:9,color:"var(--green)",border:"1px solid var(--green)",padding:"1px 4px",marginLeft:6}}>BEST</span>}
                </td>
                <td style={{padding:"10px 12px",color:"var(--text-primary)"}}>{isReg?m.r2:m.accuracy}</td>
                <td style={{padding:"10px 12px",color:"var(--text-primary)"}}>{isReg?m.mae:m.f1}</td>
                <td style={{padding:"10px 12px",color:"var(--text-primary)"}}>{isReg?m.rmse:m.auc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cm.length>0 && (
        <div style={{marginBottom:20}}>
          <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,marginBottom:8}}>CONFUSION MATRIX</p>
          <div style={{display:"inline-grid",gridTemplateColumns:`repeat(${cm[0].length},1fr)`,gap:2}}>
            {cm.flatMap((row,i)=>row.map((v,j)=>{
              const max=Math.max(...cm.flat());
              const intensity=max>0?v/max:0;
              return <div key={`${i}-${j}`} style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",background:`rgba(0,245,255,${intensity*0.5})`,border:"1px solid var(--border-faint)",fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-bright)"}}>{v}</div>;
            }))}
          </div>
        </div>
      )}
      {fpr.length>0 && (
        <div>
          <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,marginBottom:8}}>ROC CURVE</p>
          <svg width="100%" height="180" viewBox="0 0 300 180" style={{border:"1px solid var(--border-faint)",background:"#030308"}}>
            <line x1="30" y1="10" x2="30" y2="160" stroke="var(--border-dim)" strokeWidth="1"/>
            <line x1="30" y1="160" x2="290" y2="160" stroke="var(--border-dim)" strokeWidth="1"/>
            <line x1="30" y1="160" x2="290" y2="10" stroke="var(--border-faint)" strokeWidth="1" strokeDasharray="4"/>
            <polyline points={fpr.map((f,i)=>`${30+f*260},${160-tpr[i]*150}`).join(" ")} fill="none" stroke={accent} strokeWidth="2"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function ShapView({data,accent}:{data:any;accent:string}) {
  const features:any[] = data.features||[];
  const maxVal = Math.max(...features.map((f:any)=>f.importance||0));
  return (
    <div>
      <p style={{fontFamily:"Inter, sans-serif",fontSize:13,color:"var(--text-muted)",marginBottom:16}}>
        Best model: {data.best_model}. Features ranked by mean |SHAP| value.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {features.map((f:any,i:number)=>{
          const colors=["var(--cyan)","var(--purple)","var(--pink)","var(--amber)","var(--green)"];
          const c=colors[i%colors.length];
          const pct=maxVal>0?((f.importance||0)/maxVal*100):0;
          return (
            <div key={f.name}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:"Fira Code, monospace",fontSize:12,color:"var(--text-bright)"}}>{f.name}</span>
                <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:c}}>{f.importance?.toFixed(4)}</span>
              </div>
              <div style={{height:6,background:"#050510",borderRadius:3}}>
                <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:3,boxShadow:`0 0 6px ${c}80`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VizView({data,accent,session}:{data:any;accent:string;session:any}) {
  const labels:string[] = data.correlation_labels||[];
  const matrix:number[][] = data.correlation_matrix||[];
  return (
    <div>
      {labels.length>0 && (
        <div style={{marginBottom:24}}>
          <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:accent,marginBottom:10}}>CORRELATION MATRIX</p>
          <div style={{overflowX:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:`80px repeat(${labels.length},1fr)`,gap:1,minWidth:300}}>
              <div/>
              {labels.map(l=><div key={l} style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",padding:"4px 2px",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis"}}>{l.slice(0,6)}</div>)}
              {matrix.map((row,i)=>[
                <div key={`l${i}`} style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",padding:"4px 2px",display:"flex",alignItems:"center"}}>{labels[i]?.slice(0,6)}</div>,
                ...row.map((v,j)=>{
                  const abs=Math.abs(v);
                  const color=v>0?`rgba(0,245,255,${abs*0.7})`:`rgba(255,0,102,${abs*0.7})`;
                  return <div key={j} title={String(v)} style={{background:color,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Fira Code, monospace",fontSize:8,color:"var(--text-bright)"}}>{v.toFixed(2)}</div>;
                })
              ])}
            </div>
          </div>
        </div>
      )}
      <p style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)"}}>
        {data.roc_ready ? "✓ ROC curve available in Evaluation step" : "Visualization data generated."}
      </p>
    </div>
  );
}
