"use client";

interface Step {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  duration?: number;
}

const STATUS_COLORS: Record<Step["status"], string> = {
  pending: "var(--text-dim)",
  running: "var(--cyan)",
  done: "var(--green)",
  error: "var(--pink)",
};

const STATUS_ICON: Record<Step["status"], React.ReactNode> = {
  pending: <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: "var(--text-dim)" }}>○</span>,
  running: <span className="pulse-dot" style={{ backgroundColor: "var(--cyan)", width: 8, height: 8 }} />,
  done: (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5} width={14} height={14}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  error: <span style={{ color: "var(--pink)", fontSize: 14 }}>✕</span>,
};

interface StepTrackerProps {
  steps: Step[];
  selectedStepId?: string;
  onStepSelect?: (id: string) => void;
}

export default function StepTracker({ steps, selectedStepId, onStepSelect }: StepTrackerProps) {
  return (
    <div className="terminal" style={{ borderRadius: 0 }}>
      {/* Dynamic Scoped CSS */}
      <style>{`
        .step-item-interactive {
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          border-left: 2px solid transparent;
        }
        .step-item-interactive:hover {
          background: rgba(255, 255, 255, 0.02);
          border-left-color: rgba(0, 245, 255, 0.2);
          padding-left: 4px;
        }
        .step-item-interactive.active-step {
          background: rgba(0, 245, 255, 0.03);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-left: 3px solid var(--cyan);
          box-shadow: 
            0 0 15px rgba(0, 245, 255, 0.08),
            inset 0 0 15px rgba(0, 245, 255, 0.03);
          padding-left: 8px;
        }
        .step-item-interactive.active-step::before {
          content: "// INSPECTING";
          position: absolute;
          right: 12px;
          top: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 8px;
          color: var(--cyan);
          letter-spacing: 0.1em;
          opacity: 0.8;
        }
      `}</style>

      {/* Terminal header */}
      <div className="terminal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div className="terminal-dot" style={{ background: "#ff5f56" }} />
          <div className="terminal-dot" style={{ background: "#ffbd2e" }} />
          <div className="terminal-dot" style={{ background: "#27c93f" }} />
          <span style={{ marginLeft: 8, fontFamily: "Fira Code, monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            datacopilot · interactive pipeline explorer
          </span>
        </div>
        <span style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "var(--cyan)", letterSpacing: "0.05em", marginRight: 8 }}>
          [CLICK TO INSPECT STEPS]
        </span>
      </div>

      {/* Steps */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((step, i) => {
          const isSelected = selectedStepId === step.id;
          const isInteractive = step.status !== "pending";

          return (
            <div
              key={step.id}
              onClick={() => isInteractive && onStepSelect?.(step.id)}
              className={`step-item-interactive ${isSelected ? "active-step" : ""}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                opacity: step.status === "pending" ? 0.3 : 1,
                padding: "10px 12px",
                position: "relative",
              }}
            >
              {/* Status icon */}
              <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                {STATUS_ICON[step.status]}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "Fira Code, monospace",
                      fontSize: 13,
                      color: isSelected ? "var(--text-bright)" : STATUS_COLORS[step.status],
                      fontWeight: isSelected ? 600 : 400,
                      letterSpacing: "0.03em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                    {step.status === "running" && <span className="blink" style={{ color: "var(--cyan)", marginLeft: 4 }}>_</span>}
                  </span>
                  {step.duration && (
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, color: isSelected ? "var(--cyan)" : "var(--text-dim)" }}>
                      {step.duration}s
                    </span>
                  )}
                </div>
                {step.detail && (
                  <p style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: isSelected ? "var(--text-primary)" : "var(--text-dim)", marginTop: 4, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    → {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
