"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Abstract system diagram — a central "core" node connected to four
 * surrounding service nodes (admin, site, payments, analytics).
 * Data dots travel along the connection lines to imply liveness.
 *
 * Pure SVG, scales with its container. Keep viewBox 320x320.
 */
export function SystemDiagram({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  // Connection paths: from outer node to center.
  const paths = [
    { d: "M 60 60 Q 110 110 160 160", key: "tl" },
    { d: "M 260 60 Q 210 110 160 160", key: "tr" },
    { d: "M 60 260 Q 110 210 160 160", key: "bl" },
    { d: "M 260 260 Q 210 210 160 160", key: "br" },
  ];

  // Outer service nodes.
  const nodes = [
    { x: 60, y: 60, label: "site", side: "tl" as const },
    { x: 260, y: 60, label: "admin", side: "tr" as const },
    { x: 60, y: 260, label: "stripe", side: "bl" as const },
    { x: 260, y: 260, label: "monitor", side: "br" as const },
  ];

  return (
    <div className={className}>
      <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
        <defs>
          {/* Subtle dot pattern fill behind the diagram */}
          <pattern id="wb-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--color-text)" opacity="0.04" />
          </pattern>
          <radialGradient id="wb-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background dots */}
        <rect width="320" height="320" fill="url(#wb-dots)" />

        {/* Core glow */}
        <circle cx="160" cy="160" r="60" fill="url(#wb-core-glow)" />

        {/* Connection lines */}
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            stroke="var(--color-border)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="3 4"
          />
        ))}

        {/* Animated data dots on each path */}
        {!reduce
          ? paths.map((p, i) => (
              <motion.circle
                key={`dot-${p.key}`}
                r="3"
                fill="var(--color-accent)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: ["0%", "100%"] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut",
                }}
                style={{
                  offsetPath: `path("${p.d}")`,
                  offsetRotate: "0deg",
                }}
              />
            ))
          : null}

        {/* Outer nodes */}
        {nodes.map((n, i) => (
          <motion.g
            key={n.label}
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r="22"
              fill="var(--color-surface)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <circle cx={n.x} cy={n.y} r="6" fill="var(--color-accent)" opacity="0.85" />
            <text
              x={n.x}
              y={n.y + 38}
              textAnchor="middle"
              className="font-mono"
              fontSize="9"
              fill="var(--color-muted)"
              letterSpacing="0.08em"
            >
              {n.label.toUpperCase()}
            </text>
          </motion.g>
        ))}

        {/* Center core */}
        <motion.g
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <circle
            cx="160"
            cy="160"
            r="32"
            fill="var(--color-text)"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          {/* Pulsing outer ring */}
          {!reduce ? (
            <motion.circle
              cx="160"
              cy="160"
              r="32"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              animate={{ r: [32, 48], opacity: [0.6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <text
            x="160"
            y="164"
            textAnchor="middle"
            className="font-mono"
            fontSize="9"
            fill="var(--color-bg)"
            letterSpacing="0.08em"
          >
            CORE
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
