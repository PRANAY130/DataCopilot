"use client";
import {
  createContext, useContext, useEffect, useRef, useState, ReactNode
} from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type StepStatus = "pending" | "running" | "paused" | "done" | "error";

export interface StepState {
  status: StepStatus;
  data: Record<string, any>;
}

export interface SessionState {
  sessionId: string;
  filename: string;
  status: "idle" | "running" | "done" | "error";
  steps: Record<string, StepState>;
  elapsed: number;
  aiInsight: string;
  connected: boolean;
}

interface SessionContextType {
  session: SessionState | null;
  startSession: (sessionId: string, idToken: string | null, mode?: string) => void;
  loadSessionFromApi: (sessionId: string, idToken: string | null) => Promise<void>;
  resumePipeline: (stepId: string, config: Record<string, any>) => void;
}

const STEP_IDS = ["upload", "analyze", "task", "preprocess", "recommend", "train", "evaluate", "shap", "viz"];

const defaultSteps = (): Record<string, StepState> =>
  Object.fromEntries(STEP_IDS.map(id => [id, { status: "pending" as StepStatus, data: {} }]));

const SessionContext = createContext<SessionContextType>({
  session: null,
  startSession: () => {},
  loadSessionFromApi: async () => {},
  resumePipeline: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  // Timer ref — StrictMode cleanup cancels this before WS ever opens
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSession = (sessionId: string, idToken: string | null, mode?: string) => {
    // Session already done — no need to reconnect
    if (session?.sessionId === sessionId && session?.status === "done") return;
    // Already live on this session
    if (activeSessionIdRef.current === sessionId && wsRef.current?.readyState === WebSocket.OPEN) return;

    // Cancel any pending delayed connection (StrictMode double-invoke cancels here)
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }

    // Close previous connection to a different session
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    activeSessionIdRef.current = sessionId;

    setSession({
      sessionId,
      filename: "",
      status: "running",
      steps: defaultSteps(),
      elapsed: 0,
      aiInsight: "",
      connected: false,
    });

    // ── Delay 120ms so StrictMode cleanup can cancel before WS is created ──
    connectTimerRef.current = setTimeout(() => {
      connectTimerRef.current = null;

      const wsBase = BACKEND_URL.replace(/^http/, "ws");
      const params = new URLSearchParams();
      if (idToken) params.set("token", idToken);
      if (mode) params.set("mode", mode);
      const queryString = params.toString() ? `?${params.toString()}` : "";
      const url = `${wsBase}/ws/analysis/${sessionId}${queryString}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) { ws.close(); return; }
        setSession(prev => prev ? { ...prev, connected: true } : prev);
      };

      ws.onmessage = (evt) => {
        if (wsRef.current !== ws) return;
        try { handlePipelineEvent(JSON.parse(evt.data)); }
        catch (e) { console.error("WS parse error:", e); }
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) return;
        console.error("WebSocket error — check backend at", BACKEND_URL);
        setSession(prev => prev ? { ...prev, status: "error", connected: false } : prev);
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        setSession(prev => prev ? { ...prev, connected: false } : prev);
      };
    }, 120);
  };


  const handlePipelineEvent = (msg: any) => {
    const { step, status, data, elapsed } = msg;

    if (step === "complete" && status === "done") {
      setSession(prev => prev ? {
        ...prev,
        status: "done",
        elapsed: elapsed || prev.elapsed,
        aiInsight: data?.ai_insight || prev.aiInsight,
      } : prev);
      return;
    }

    if (step === "error") {
      setSession(prev => prev ? { ...prev, status: "error" } : prev);
      return;
    }

    setSession(prev => {
      if (!prev) return prev;
      const updatedSteps = { ...prev.steps };

      if (status === "running") {
        updatedSteps[step] = { status: "running", data: {} };
      } else if (status === "paused") {
        updatedSteps[step] = { status: "paused", data: data || {} };
      } else if (status === "done") {
        updatedSteps[step] = { status: "done", data: data || {} };
      } else if (status === "log") {
        const existing = updatedSteps["train"] || { status: "running", data: {} };
        const logs = { ...(existing.data.logs || {}) };
        const modelId = data?.model_id || "unknown";
        logs[modelId] = [...(logs[modelId] || []), data?.log || ""];
        updatedSteps["train"] = { status: "running", data: { ...existing.data, logs } };
      } else if (status === "error") {
        updatedSteps[step] = { status: "error", data: data || {} };
      }

      const filename = step === "upload" && status === "done"
        ? data?.filename || prev.filename
        : prev.filename;

      return {
        ...prev,
        steps: updatedSteps,
        elapsed: elapsed || prev.elapsed,
        filename,
      };
    });
  };

  const loadSessionFromApi = async (sessionId: string, idToken: string | null) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

      const res = await fetch(`${BACKEND_URL}/api/session/${sessionId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();

      const steps: Record<string, StepState> = defaultSteps();
      for (const [stepId, stepData] of Object.entries(data.steps || {})) {
        const s = stepData as any;
        steps[stepId] = { status: s.status || "pending", data: s.data || {} };
      }

      setSession({
        sessionId,
        filename: data.filename || "",
        status: data.status || "done",
        steps,
        elapsed: 0,
        aiInsight: data.ai_insight || "",
        connected: false,
      });
    } catch (e) {
      console.error("Failed to load session from API:", e);
    }
  };

  const resumePipeline = (stepId: string, config: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: "resume",
        step: stepId,
        data: config
      }));
      setSession(prev => {
        if (!prev) return prev;
        const updatedSteps = { ...prev.steps };
        updatedSteps[stepId] = { ...updatedSteps[stepId], status: "running" };
        return { ...prev, steps: updatedSteps };
      });
    }
  };

  return (
    <SessionContext.Provider value={{ session, startSession, loadSessionFromApi, resumePipeline }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
