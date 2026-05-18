"use client";
import { useState, useRef, useEffect } from "react";
import NeonButton from "@/components/ui/NeonButton";

interface Message {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Why was this model selected?",
  "Which features matter most?",
  "Why is accuracy low?",
  "How can I improve performance?",
  "Explain the preprocessing steps",
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Based on my analysis of your dataset, I can provide detailed insights. The model was selected based on your dataset's size (891 rows), mixed feature types, and the binary classification target. Would you like me to explain any specific aspect in more detail?",
};

export default function ChatInterface({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: `Neural link established. I've analyzed your dataset and I'm ready to answer questions. I detected a **binary classification** problem with 12 features. Your best model is **XGBoost** with 83.4% accuracy. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Mock AI response
    await new Promise((r) => setTimeout(r, 1200));
    const aiMsg: Message = {
      role: "ai",
      text: MOCK_RESPONSES[text.toLowerCase()] ?? MOCK_RESPONSES.default,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, aiMsg]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 500 }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 32, height: 32,
                border: `1px solid ${msg.role === "ai" ? "var(--cyan)" : "var(--pink)"}`,
                background: msg.role === "ai" ? "rgba(0,245,255,0.08)" : "rgba(255,0,102,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontFamily: "Fira Code, monospace",
                fontSize: 10,
                color: msg.role === "ai" ? "var(--cyan)" : "var(--pink)",
              }}
            >
              {msg.role === "ai" ? "AI" : "U"}
            </div>

            {/* Bubble */}
            <div
              className={msg.role === "ai" ? "chat-bubble-ai" : "chat-bubble-user"}
              style={{
                padding: "12px 16px",
                maxWidth: "75%",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.65,
              }}
            >
              {msg.text}
              <div style={{ marginTop: 6, fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)" }}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, border: "1px solid var(--cyan)", background: "rgba(0,245,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--cyan)" }}>AI</div>
            <div className="chat-bubble-ai" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", animation: `pulse-glow 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              fontFamily: "Fira Code, monospace",
              fontSize: 11,
              color: "var(--text-muted)",
              background: "transparent",
              border: "1px solid var(--border-faint)",
              padding: "5px 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--cyan)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-faint)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border-faint)",
          background: "rgba(0,245,255,0.02)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: "Fira Code, monospace", fontSize: 14, color: "var(--cyan)", flexShrink: 0 }}>{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask the AI about your data..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "Fira Code, monospace",
            fontSize: 13,
            color: "var(--text-primary)",
            letterSpacing: "0.03em",
          }}
        />
        <NeonButton variant="cyan" size="sm" onClick={() => send(input)} disabled={!input.trim() || loading}>
          Send
        </NeonButton>
      </div>
    </div>
  );
}
