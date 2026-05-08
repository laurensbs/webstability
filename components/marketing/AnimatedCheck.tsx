"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Stroke-draw check-icon. Triggert bij scroll-in-view met een korte
 * delay-stagger zodat elke bullet apart "tikt." Vervangt de statische
 * lucide Check op de diensten-pagina voor extra knipoog.
 */
export function AnimatedCheck({
  delay = 0,
  className = "h-3.5 w-3.5",
  color = "var(--color-accent)",
}: {
  delay?: number;
  className?: string;
  color?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M 3 8.5 L 6.5 12 L 13 4.5"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
