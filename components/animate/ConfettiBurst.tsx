"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

type Props = {
  /** Toggle 'true' fired een single burst. Parent moet 'm na ~1.5s
   * weer naar 'false' zetten zodat de volgende fire opnieuw kan. */
  fire: boolean;
  /** Anchor: rond welk centrum confetti uitbarst. 'center' = midden
   * van parent (parent moet relative zijn). */
  anchor?: "center" | "top";
  /** Color-set — default cream-palette mix. 'wine' voor discount/livegang. */
  variant?: "default" | "wine" | "success";
};

const PARTICLE_COUNT = 14;

const VARIANTS = {
  default: ["var(--color-accent)", "var(--color-accent-soft)", "var(--color-text)"],
  wine: ["var(--color-wine)", "var(--color-wine-soft)", "var(--color-accent)"],
  success: ["var(--color-success)", "var(--color-accent)", "var(--color-bg-warm)"],
} as const;

/**
 * CSS-only confetti-burst voor success-acties — bv. "korting toegepast",
 * "project markeer-live". 14 dotjes vliegen radiaal uit het midden, fade
 * + scale tijdens flight. Geen externe deps. Honoreert
 * prefers-reduced-motion (geen burst, wel een korte sparkle).
 */
export function ConfettiBurst({ fire, anchor = "center", variant = "default" }: Props) {
  const reduce = useReducedMotion();
  const colors = VARIANTS[variant];

  // Genereer particles 1× — pin angles + distances zodat ze stabiel
  // zijn over re-renders (anders flikkert 't bij elke parent-update).
  const particles = React.useMemo(() => {
    // Deterministic pseudo-random per index — voorkomt Math.random
    // in render-body (React purity-rule) en garandeert stabiele
    // particles over re-renders.
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const seed1 = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
      const seed2 = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1);
      const seed3 = Math.abs((Math.sin(i * 39.346) * 43758.5453) % 1);
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 60 + seed1 * 40;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        size: 4 + seed2 * 4,
        rotate: seed3 * 360,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  return (
    <AnimatePresence>
      {fire ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute z-30 ${
            anchor === "center" ? "top-1/2 left-1/2" : "top-2 left-1/2"
          } -translate-x-1/2 -translate-y-1/2`}
        >
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
              animate={
                reduce
                  ? { scale: [0, 1, 0], opacity: [1, 1, 0] }
                  : {
                      x: p.dx,
                      y: p.dy,
                      scale: [0, 1, 0.3],
                      opacity: [1, 1, 0],
                      rotate: p.rotate,
                    }
              }
              exit={{ opacity: 0 }}
              transition={{
                duration: reduce ? 0.6 : 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute block rounded-[1px]"
              style={{
                width: `${p.size}px`,
                height: `${p.size * 0.4}px`,
                background: p.color,
              }}
            />
          ))}
        </span>
      ) : null}
    </AnimatePresence>
  );
}
