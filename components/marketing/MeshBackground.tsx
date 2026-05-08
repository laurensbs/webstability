"use client";

import { useReducedMotion } from "motion/react";

/**
 * Animated gradient-mesh — wijn → text → accent met langzame rotatie.
 * Decorative, voor achter de Studio featured-card. CSS-only, geen WebGL.
 *
 * Honoreert prefers-reduced-motion door rotatie uit te zetten (kleur
 * blijft).
 */
export function MeshBackground({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="wb-mesh-conic absolute inset-[-50%]"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at 30% 20%, rgba(107,30,44,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 70% 80%, rgba(201,97,79,0.40) 0%, transparent 60%),
            radial-gradient(ellipse 35% 35% at 80% 20%, rgba(244,220,212,0.30) 0%, transparent 60%)
          `,
          filter: "blur(40px)",
          animation: reduce ? "none" : "wb-mesh-rotate 32s linear infinite",
          transformOrigin: "50% 50%",
        }}
      />
    </div>
  );
}
