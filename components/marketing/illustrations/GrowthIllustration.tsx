"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Growth-illustratie: line-graph die zichzelf trekt + cream confetti-
 * puntjes bovenaan op de piek. Suggereert "we doen door, en het werkt."
 */
export function GrowthIllustration() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      {/* Card */}
      <rect
        x="10"
        y="14"
        width="180"
        height="102"
        rx="10"
        fill="#FFFFFF"
        stroke="#1F1B16"
        strokeWidth="1.5"
      />

      {/* Header */}
      <text
        x="22"
        y="32"
        fontFamily="ui-monospace, monospace"
        fontSize="6"
        fontWeight="600"
        fill="#1F1B16"
      >
        GROEI · LAATSTE 6 MND
      </text>
      <text
        x="178"
        y="32"
        fontFamily="ui-monospace, monospace"
        fontSize="6"
        fill="#6B1E2C"
        textAnchor="end"
      >
        +42%
      </text>

      {/* Grid-lijnen */}
      {[50, 70, 90].map((y) => (
        <line
          key={y}
          x1="22"
          y1={y}
          x2="178"
          y2={y}
          stroke="#1F1B16"
          strokeWidth="0.4"
          opacity="0.08"
        />
      ))}

      {/* Area-fill onder de lijn */}
      <defs>
        <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9614F" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C9614F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 22 90 L 50 78 L 78 82 L 106 64 L 134 56 L 162 44 L 178 38 L 178 100 L 22 100 Z"
        fill="url(#growth-fill)"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: 1.2 }}
      />

      {/* Lijn — stroke-draw */}
      <motion.path
        d="M 22 90 L 50 78 L 78 82 L 106 64 L 134 56 L 162 44 L 178 38"
        stroke="#C9614F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Eind-punt: wijn-rode dot met halo */}
      <motion.g
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "178px 38px" }}
      >
        <circle cx="178" cy="38" r="4" fill="#6B1E2C" />
        <circle cx="178" cy="38" r="4" fill="#FFFFFF" stroke="#6B1E2C" strokeWidth="1.5" />
      </motion.g>

      {/* Cream confetti-puntjes — knipoog op de piek */}
      {[
        { cx: 168, cy: 24, r: 1.2, fill: "#C9614F" },
        { cx: 184, cy: 22, r: 1.5, fill: "#6B1E2C" },
        { cx: 178, cy: 16, r: 1, fill: "#5A7A4A" },
        { cx: 188, cy: 30, r: 1.2, fill: "#C9614F" },
      ].map((c, i) => (
        <motion.circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={c.fill}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 1.6 + i * 0.06 }}
        />
      ))}
    </svg>
  );
}
