"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Compact 404 illustration — a single core node with three broken
 * dashed paths trailing off to nowhere. Same visual vocabulary as the
 * hero SystemDiagram so the empty page still feels on-brand.
 */
export function NotFoundIllustration({
  symbol = "?",
  className,
}: {
  symbol?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const paths = [
    { d: "M 90 90 Q 130 130 160 160", key: "tl" },
    { d: "M 230 90 Q 190 130 160 160", key: "tr" },
    { d: "M 160 230 Q 160 200 160 160", key: "b" },
  ];

  return (
    <div className={className}>
      <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
        <defs>
          <pattern id="nf-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--color-text)" opacity="0.04" />
          </pattern>
          <radialGradient id="nf-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="320" fill="url(#nf-dots)" />
        <circle cx="160" cy="160" r="60" fill="url(#nf-glow)" />
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
        {/* Endpoint nodes that are visibly "off" — empty rings */}
        {[
          { x: 90, y: 90 },
          { x: 230, y: 90 },
          { x: 160, y: 230 },
        ].map((n, i) => (
          <motion.circle
            key={`${n.x}-${n.y}`}
            cx={n.x}
            cy={n.y}
            r="14"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          />
        ))}
        <motion.g
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <circle
            cx="160"
            cy="160"
            r="32"
            fill="var(--color-text)"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
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
            y="170"
            textAnchor="middle"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="28"
            fill="var(--color-bg)"
          >
            {symbol}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
