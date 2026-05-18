import { ReactNode, CSSProperties } from "react";

type AccentColor = "cyan" | "pink" | "purple";

interface CyberCardProps {
  children: ReactNode;
  accent?: AccentColor;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  noPad?: boolean;
}

const accentClass: Record<AccentColor, string> = {
  cyan: "cyber-card",
  pink: "cyber-card cyber-card-pink",
  purple: "cyber-card cyber-card-purple",
};

export default function CyberCard({
  children,
  accent = "cyan",
  className = "",
  style,
  onClick,
  noPad = false,
}: CyberCardProps) {
  return (
    <div
      className={`${accentClass[accent]} ${className}`}
      style={{ padding: noPad ? 0 : "28px 28px", cursor: onClick ? "pointer" : undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
