"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Big terracotta quotation mark that draws itself in once it scrolls into
 * view. SVG path-length tween — pure transform/opacity, no layout work.
 */
export function QuoteMarkDraw({ size = 64, className }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden
      className={className}
    >
      <motion.path
        d="M15 22 Q15 12 25 12 L25 22 Q20 22 20 28 L20 38 L15 38 Z M35 22 Q35 12 45 12 L45 22 Q40 22 40 28 L40 38 L35 38 Z"
        fill="var(--color-accent)"
        initial={reduce ? { opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.6 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}
