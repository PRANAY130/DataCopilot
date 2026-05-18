"use client";
import { useEffect, useRef } from "react";

interface GlitchTextProps {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  interval?: number; // ms between glitches
}

export default function GlitchText({
  text,
  tag: Tag = "span",
  className = "",
  style = {},
  interval = 4000,
}: GlitchTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = () => {
      el.classList.add("glitch-wrapper");
      setTimeout(() => el.classList.remove("glitch-wrapper"), 600);
    };

    const timer = setInterval(trigger, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    // @ts-expect-error dynamic tag
    <Tag
      ref={ref}
      data-text={text}
      className={className}
      style={style}
    >
      {text}
    </Tag>
  );
}
