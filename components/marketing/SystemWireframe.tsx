"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Abstracte "systeem"-wireframe — 5 nodes verbonden door stroke-draw
 * lijnen, één centrale hub met puls. Geeft de "alles geïntegreerd"-
 * boodschap zonder caravan-illustratie. Cream lijnen op donker, zelfde
 * sfeer als /login en StudioStatement.
 *
 * Geen R3F, alleen SVG + motion/react — 0kb extra bundle, scaleert
 * naar elke breedte, honoreert prefers-reduced-motion.
 */
export function SystemWireframe() {
  const reduce = useReducedMotion();

  // Layout — viewBox 400×320. Center hub op (200, 160), 4 satellites.
  const hub = { x: 200, y: 160 };
  const satellites = [
    { x: 60, y: 60, label: "Site" },
    { x: 340, y: 60, label: "Admin" },
    { x: 60, y: 260, label: "Klant" },
    { x: 340, y: 260, label: "API" },
  ];

  return (
    <div className="relative aspect-[5/4] w-full">
      <svg viewBox="0 0 400 320" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          {/* Subtiele gradient voor de verbindingslijnen */}
          <linearGradient id="wf-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(245,240,232,0.15)" />
            <stop offset="50%" stopColor="rgba(245,240,232,0.45)" />
            <stop offset="100%" stopColor="rgba(245,240,232,0.15)" />
          </linearGradient>
        </defs>

        {/* Verbindingslijnen — stroke-draw bij scroll-in */}
        {satellites.map((s, i) => (
          <motion.line
            key={`line-${i}`}
            x1={s.x}
            y1={s.y}
            x2={hub.x}
            y2={hub.y}
            stroke="url(#wf-line)"
            strokeWidth={1.2}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}

        {/* Satellite nodes — stip pop-in na de lijn */}
        {satellites.map((s, i) => (
          <motion.g
            key={`sat-${i}`}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.4,
              delay: 1.2 + i * 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          >
            {/* Outer ring */}
            <circle
              cx={s.x}
              cy={s.y}
              r={14}
              fill="none"
              stroke="rgba(245,240,232,0.25)"
              strokeWidth={1}
            />
            {/* Inner dot */}
            <circle cx={s.x} cy={s.y} r={4} fill="rgba(245,240,232,0.9)" />
            {/* Mono-label boven/onder */}
            <text
              x={s.x}
              y={s.y < 160 ? s.y - 24 : s.y + 32}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="9"
              fill="rgba(245,240,232,0.55)"
              letterSpacing="1.5"
            >
              {s.label.toUpperCase()}
            </text>
          </motion.g>
        ))}

        {/* Center hub — terracotta + pulse */}
        <motion.g
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 1.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
        >
          <circle cx={hub.x} cy={hub.y} r={28} fill="rgba(201,97,79,0.15)" />
          <circle cx={hub.x} cy={hub.y} r={20} fill="rgba(201,97,79,0.35)" />
          <circle cx={hub.x} cy={hub.y} r={12} fill="rgb(201,97,79)" />
          {/* Pulserende ring — alleen wanneer motion mag */}
          {!reduce ? (
            <circle
              cx={hub.x}
              cy={hub.y}
              r={28}
              fill="none"
              stroke="rgba(201,97,79,0.6)"
              strokeWidth={1}
            >
              <animate attributeName="r" from="28" to="60" dur="3s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                from="0.6"
                to="0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          ) : null}
        </motion.g>

        {/* Center label */}
        <motion.text
          x={hub.x}
          y={hub.y + 56}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="9"
          fill="rgba(245,240,232,0.85)"
          letterSpacing="1.5"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 1.9 }}
        >
          ÉÉN SYSTEEM
        </motion.text>
      </svg>
    </div>
  );
}
