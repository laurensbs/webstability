"use client";

import { useReducedMotion } from "motion/react";

/**
 * Vervangt de oude R3F distortion-blob op /login en /verify door een
 * CSS-only conic-gradient mesh. Geen three, geen WebGL — gewoon een
 * langzaam roterende warme gradient die de cream/terracotta-palette
 * versterkt zonder "1990s screensaver"-vibes.
 *
 * Honoreert prefers-reduced-motion (rotatie uit, kleur blijft).
 */
export function LoginAmbientMount({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={`wb-mesh-conic ${className ?? ""}`}
      style={{
        background:
          "conic-gradient(from 0deg at 60% 40%, rgba(201,97,79,0.55), rgba(44,95,93,0.4), rgba(244,220,212,0.6), rgba(107,30,44,0.35), rgba(201,97,79,0.55))",
        filter: "blur(60px)",
        animation: reduce ? "none" : "wb-mesh-rotate 32s linear infinite",
        transformOrigin: "60% 40%",
      }}
    />
  );
}
