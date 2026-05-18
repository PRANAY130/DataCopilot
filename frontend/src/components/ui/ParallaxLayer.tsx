"use client";
import { useEffect, useRef, CSSProperties } from "react";

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number; // 0 = no movement, 1 = full scroll speed
  style?: CSSProperties;
  className?: string;
}

export default function ParallaxLayer({ children, speed = 0.3, style, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const scrolled = window.scrollY;
      const offset = scrolled * speed;
      el.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`parallax-layer ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
