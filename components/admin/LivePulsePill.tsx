"use client";

import { useReducedMotion } from "motion/react";

type Variant = "wine" | "accent" | "success" | "muted";

const COLORS: Record<Variant, { bg: string; text: string; dot: string }> = {
  wine: {
    bg: "bg-(--color-wine)/10",
    text: "text-(--color-wine)",
    dot: "bg-(--color-wine)",
  },
  accent: {
    bg: "bg-(--color-accent)/10",
    text: "text-(--color-accent)",
    dot: "bg-(--color-accent)",
  },
  success: {
    bg: "bg-(--color-success)/10",
    text: "text-(--color-success)",
    dot: "bg-(--color-success)",
  },
  muted: {
    bg: "bg-(--color-bg-warm)",
    text: "text-(--color-muted)",
    dot: "bg-(--color-muted)",
  },
};

/**
 * Status-pill met live-pulse-dot. Subtiele 2s scale-pulse op de dot
 * (geen full ring-ping — minder schreeuwerig dan animate-ping). Voor
 * 'open ticket', 'VIP', 'build active', etc. door admin/portal.
 */
export function LivePulsePill({
  variant = "accent",
  children,
  className = "",
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const c = COLORS[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text} ${className}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {!reduce ? (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-50`}
            style={{ animation: "wb-soft-pulse 2s ease-in-out infinite" }}
          />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${c.dot}`} />
      </span>
      {children}
    </span>
  );
}
