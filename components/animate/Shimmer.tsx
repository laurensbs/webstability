"use client";

import { useReducedMotion } from "motion/react";

/**
 * Skeleton-shimmer. Vervangt plain Tailwind animate-pulse met een
 * subtiele gradient-sweep van links naar rechts. Premium feel zonder
 * dat je weet dat het laden is.
 *
 * Honoreert prefers-reduced-motion (statisch grijs blok).
 */
export function Shimmer({
  className = "",
  width,
  height,
  rounded = "md",
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const reduce = useReducedMotion();
  const radii = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  } as const;

  return (
    <span
      aria-hidden
      className={`block overflow-hidden ${radii[rounded]} bg-(--color-bg-warm) ${className}`}
      style={{ width, height }}
    >
      {!reduce ? (
        <span
          className="block h-full w-full animate-[wb-shimmer_1.6s_ease-in-out_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : null}
    </span>
  );
}
