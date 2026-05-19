"use client";
import { use, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import NeonButton from "@/components/ui/NeonButton";
import ChatInterface from "@/components/chat/ChatInterface";
import { useAuthHeader } from "@/context/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ChatPage({ params }: { params: Promise<{id:string}>|any }) {
  const unwrapped = params instanceof Promise ? use(params) : params;
  const sessionId = unwrapped.id;
  const authHeader = useAuthHeader();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) return;
    const headers: Record<string,string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    fetch(`${BACKEND_URL}/api/session/${sessionId}`, { headers })
      .then(r => r.json()).then(setSession).catch(console.error);
  }, [sessionId, authHeader]);

  const evaluate = session?.steps?.evaluate?.data || {};
  const best = (evaluate.metrics||[]).find((m:any)=>m.is_best) || {};
  const task = session?.steps?.task?.data || {};

  return (
    <main style={{background:"var(--bg-void)",minHeight:"100vh",display:"flex",flexDirection:"column"}} className="cyber-grid-sm">
      <Navbar />
      <div style={{flex:1,maxWidth:1200,margin:"0 auto",width:"100%",padding:"88px 24px 24px",display:"grid",gridTemplateColumns:"260px 1fr",gap:20,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14,paddingTop:12}}>
          <div>
            <p className="section-eyebrow" style={{color:"var(--cyan)",marginBottom:4}}>// AI ASSISTANT</p>
            <h1 style={{fontFamily:"Orbitron, sans-serif",fontWeight:700,fontSize:"1.2rem",color:"var(--text-bright)"}}>Conversational Analytics</h1>
          </div>
          <div style={{border:"1px solid var(--border-faint)",background:"var(--bg-card)",padding:"16px"}}>
            <p style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Session</p>
            {[
              {label:"Dataset", value:session?.filename||"—"},
              {label:"Task", value:task.task_type||"—"},
              {label:"Target", value:task.target_col||"—"},
              {label:"Best Model", value:evaluate.best_model||"—"},
              {label:"Accuracy", value:best.accuracy?`${(best.accuracy*100).toFixed(1)}%`:(best.r2||"—")},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-muted)"}}>{row.label}</span>
                <span style={{fontFamily:"Fira Code, monospace",fontSize:11,color:"var(--text-primary)",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{border:"1px solid var(--border-faint)",background:"var(--bg-card)",padding:"14px 16px"}}>
            <p style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--text-muted)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Navigate</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <NeonButton href={`/results/${sessionId}`} variant="ghost" size="sm">← Back to Results</NeonButton>
              <NeonButton href="/upload" variant="ghost" size="sm">New Analysis</NeonButton>
              <NeonButton href="/dashboard" variant="ghost" size="sm">My Sessions</NeonButton>
            </div>
          </div>
          <div style={{border:"1px solid rgba(0,255,136,0.15)",background:"rgba(0,255,136,0.03)",padding:"12px 16px"}}>
            <p style={{fontFamily:"Fira Code, monospace",fontSize:9,color:"var(--green)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// AI Engine</p>
            {["Gemini 1.5 Flash","Groq Llama-3 (fallback)"].map(m=>(
              <div key={m} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <div className="pulse-dot" style={{backgroundColor:"var(--green)",width:5,height:5}}/>
                <span style={{fontFamily:"Fira Code, monospace",fontSize:10,color:"var(--text-muted)"}}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{border:"1px solid var(--border-faint)",background:"var(--bg-card)",display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}} className="cyber-card">
          <ChatInterface sessionId={sessionId} />
        </div>
      </div>
    </main>
  );
}
