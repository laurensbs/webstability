"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Vervangt de oude handgemaakte 3D-caravan op /verhuur door een rustige
 * inline-SVG illustratie. Subtiele bobbing + soft accent halo achter.
 * Geen three, geen WebGL — laadt instant en voelt premium-illustratief.
 */
export function CaravanMount({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={className} aria-hidden>
      <div
        className="wb-soft-halo absolute inset-[10%] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-accent-soft), transparent 65%)" }}
      />
      <motion.svg
        viewBox="0 0 200 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Caravan body */}
        <rect
          x="30"
          y="50"
          width="120"
          height="55"
          rx="14"
          fill="var(--color-surface)"
          stroke="var(--color-text)"
          strokeWidth="2"
        />
        {/* Window */}
        <rect
          x="44"
          y="62"
          width="40"
          height="24"
          rx="4"
          fill="var(--color-bg-warm)"
          stroke="var(--color-text)"
          strokeWidth="1.5"
        />
        {/* Door */}
        <rect
          x="100"
          y="62"
          width="22"
          height="32"
          rx="3"
          fill="var(--color-bg-warm)"
          stroke="var(--color-text)"
          strokeWidth="1.5"
        />
        {/* Hitch */}
        <line x1="30" y1="78" x2="14" y2="92" stroke="var(--color-text)" strokeWidth="2" />
        <circle cx="13" cy="93" r="3" fill="var(--color-accent)" />
        {/* Wheels */}
        <circle
          cx="62"
          cy="105"
          r="11"
          fill="var(--color-text)"
          stroke="var(--color-text)"
          strokeWidth="2"
        />
        <circle cx="62" cy="105" r="4" fill="var(--color-bg)" />
        <circle
          cx="120"
          cy="105"
          r="11"
          fill="var(--color-text)"
          stroke="var(--color-text)"
          strokeWidth="2"
        />
        <circle cx="120" cy="105" r="4" fill="var(--color-bg)" />
        {/* Roof accent stripe */}
        <rect x="36" y="48" width="108" height="3" rx="1.5" fill="var(--color-accent)" />
      </motion.svg>
    </div>
  );
}
