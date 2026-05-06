"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Een groen status-dotje dat pas pulseert wanneer het in beeld komt,
 * niet de hele pagina lang. Zo voelt de site 'levend' op de plek
 * waar je kijkt zonder dat je tien tegelijk lopende animaties hebt.
 *
 * Gebruik als vervanger voor de oude `animate-ping`-pattern:
 *
 *   <LivePulse />               // standaard 1.5x1.5 dot, success-groen
 *   <LivePulse size={2} />      // 2x2 dot
 *   <LivePulse color="white" /> // op donkere achtergrond
 *
 * Reduced-motion: pulse blijft uit, dot is wel zichtbaar.
 */
export function LivePulse({
  size = 1.5,
  color = "success",
  className = "",
}: {
  /** Tailwind-grootte in 4px-units (1.5 = h-1.5/w-1.5 = 6px). */
  size?: 1.5 | 2 | 2.5 | 3;
  /** Welke kleur — success (groen) of white (op donkere bg). */
  color?: "success" | "white";
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.5, margin: "-10% 0px -10% 0px" });
  const reduce = useReducedMotion();

  const pulse = inView && !reduce;

  const dotSizeClass =
    size === 1.5
      ? "h-1.5 w-1.5"
      : size === 2
        ? "h-2 w-2"
        : size === 2.5
          ? "h-2.5 w-2.5"
          : "h-3 w-3";
  const colorClass = color === "white" ? "bg-white" : "bg-(--color-success)";

  return (
    <span ref={ref} className={`relative flex ${dotSizeClass} ${className}`}>
      {pulse ? (
        <motion.span
          aria-hidden
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          className={`absolute inline-flex h-full w-full rounded-full ${colorClass}`}
        />
      ) : null}
      <span className={`relative inline-flex rounded-full ${dotSizeClass} ${colorClass}`} />
    </span>
  );
}
