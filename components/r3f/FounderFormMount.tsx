"use client";

import { useReducedMotion } from "motion/react";

/**
 * Vervangt de transmissive torus-knot (R3F) op /over door een rustige
 * dubbele halo-glow. Een founder-page hoort een persoon te tonen of
 * iets warms — geen geometrisch object dat afleidt.
 */
export function FounderFormMount({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(244,220,212,0.7) 0%, transparent 55%), radial-gradient(ellipse at 70% 75%, rgba(44,95,93,0.35) 0%, transparent 55%)",
          filter: "blur(40px)",
          animation: reduce ? "none" : "wb-mesh-rotate 60s linear infinite",
          transformOrigin: "50% 50%",
        }}
      />
    </div>
  );
}
