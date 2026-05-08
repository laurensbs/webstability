"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Care-illustratie: monitoring-dashboard met staaf-grafiek + groene
 * "all systems go"-dot + wijn-rode incident-marker (die is opgelost).
 * Suggereert "we houden het in de gaten en lossen op voor je het merkt."
 */
export function CareIllustration() {
  const reduce = useReducedMotion();

  // Deterministische "uptime"-staafjes — laatste is wijn-rood (kort
  // incident dat alweer opgelost is).
  const bars = [
    { x: 20, h: 32 },
    { x: 32, h: 38 },
    { x: 44, h: 28 },
    { x: 56, h: 42 },
    { x: 68, h: 36 },
    { x: 80, h: 44 },
    { x: 92, h: 40 },
    { x: 104, h: 14, wine: true },
    { x: 116, h: 38 },
    { x: 128, h: 42 },
    { x: 140, h: 46 },
    { x: 152, h: 44 },
    { x: 164, h: 48 },
  ];

  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      {/* Card-frame */}
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

      {/* Header met dot + label */}
      <g>
        <circle cx="22" cy="28" r="3" fill="#5A7A4A" />
        {!reduce ? (
          <circle cx="22" cy="28" r="3" fill="none" stroke="#5A7A4A" strokeWidth="1.5">
            <animate attributeName="r" from="3" to="8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        ) : null}
        <text
          x="32"
          y="31"
          fontFamily="ui-monospace, monospace"
          fontSize="6"
          fontWeight="600"
          fill="#1F1B16"
        >
          UPTIME · 99.98%
        </text>
        <text
          x="178"
          y="31"
          fontFamily="ui-monospace, monospace"
          fontSize="5.5"
          fill="#6B645A"
          textAnchor="end"
        >
          14 dagen
        </text>
      </g>

      {/* Baseline */}
      <line x1="20" y1="100" x2="172" y2="100" stroke="#1F1B16" strokeWidth="0.5" opacity="0.15" />

      {/* Staafjes — stagger up */}
      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          width="7"
          rx="1.5"
          fill={b.wine ? "#6B1E2C" : "#C9614F"}
          opacity={b.wine ? 1 : 0.85}
          initial={reduce ? false : { y: 100, height: 0 }}
          whileInView={{ y: 100 - b.h, height: b.h }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}
