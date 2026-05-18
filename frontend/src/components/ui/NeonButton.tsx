import Link from "next/link";
import { CSSProperties, ReactNode } from "react";

type Variant = "cyan" | "pink" | "ghost" | "solid-cyan";
type Size = "sm" | "md" | "lg";

interface NeonButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
  disabled?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: "btn-sm",
  md: "btn",
  lg: "btn btn-lg",
};
const variantMap: Record<Variant, string> = {
  cyan: "btn-cyan",
  pink: "btn-pink",
  ghost: "btn-ghost",
  "solid-cyan": "btn-solid-cyan",
};

export default function NeonButton({
  children,
  href,
  onClick,
  variant = "cyan",
  size = "md",
  className = "",
  style,
  type = "button",
  disabled = false,
}: NeonButtonProps) {
  const cls = `btn ${sizeMap[size]} ${variantMap[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
