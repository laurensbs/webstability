"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Platform-illustratie: blueprint-grid met een terracotta lijn die
 * zichzelf trekt + drie nodes die binnen-popen. Suggereert "we bouwen
 * een systeem op maat dat met elkaar verbonden is."
 */
export function PlatformIllustration() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id="plat-grid" width="12" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M 12 0 L 0 0 0 12"
            fill="none"
            stroke="#1F1B16"
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="200" height="130" fill="url(#plat-grid)" />

      {/* Verbindingslijnen — stroke-draw */}
      <motion.path
        d="M 36 92 L 36 50 L 100 50 L 100 30 L 164 30 L 164 92 L 100 92 L 100 50"
        stroke="#C9614F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Drie nodes — pop in op het einde */}
      {[
        { cx: 36, cy: 92, fill: "#FFFFFF", stroke: "#6B1E2C", delay: 0.9 },
        { cx: 164, cy: 30, fill: "#FFFFFF", stroke: "#C9614F", delay: 1.1 },
        { cx: 100, cy: 50, fill: "#C9614F", stroke: "#1F1B16", delay: 1.3 },
      ].map((n, i) => (
        <motion.circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={6}
          fill={n.fill}
          stroke={n.stroke}
          strokeWidth={2}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: n.delay, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
        />
      ))}

      {/* Mini-puls op center node */}
      {!reduce ? (
        <circle cx="100" cy="50" r="6" fill="none" stroke="#C9614F" strokeWidth="1.5">
          <animate attributeName="r" from="6" to="14" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      ) : null}
    </svg>
  );
}
