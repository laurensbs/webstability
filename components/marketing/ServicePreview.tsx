"use client";

import { motion, useReducedMotion } from "motion/react";

type ServiceId = "platform" | "webshop" | "care" | "growth";

/**
 * Per-service mini-illustratie. CSS+SVG, geen externe afbeeldingen.
 * Klein (max 120×72px) en zit rechts-boven van de service-card als
 * decorative anker. Differentieert de 4 services visueel zonder de
 * card-styling te breken.
 */
export function ServicePreview({ id }: { id: ServiceId }) {
  const reduce = useReducedMotion();

  if (id === "platform") return <PlatformPreview reduce={Boolean(reduce)} />;
  if (id === "webshop") return <WebshopPreview reduce={Boolean(reduce)} />;
  if (id === "care") return <CarePreview reduce={Boolean(reduce)} />;
  return <GrowthPreview reduce={Boolean(reduce)} />;
}

/* Platform — mini-kanban met 3 kolommen × 2 cards. */
function PlatformPreview({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="120" height="72" rx="8" fill="var(--color-bg-warm)" />
      {/* 3 columns */}
      {[0, 1, 2].map((c) => (
        <g key={c}>
          <rect
            x={6 + c * 38}
            y="8"
            width="34"
            height="56"
            rx="4"
            fill="var(--color-surface)"
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
          {[0, 1].map((r) => (
            <motion.rect
              key={r}
              x={10 + c * 38}
              y={14 + r * 20}
              width="26"
              height="14"
              rx="3"
              fill={c === 1 && r === 0 ? "var(--color-accent-soft)" : "var(--color-bg-warm)"}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + (c * 2 + r) * 0.05 }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* Webshop — mini browser-frame met productkaart. */
function WebshopPreview({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="120" height="72" rx="8" fill="var(--color-surface)" />
      <rect x="0" y="0" width="120" height="14" rx="8" fill="var(--color-bg-warm)" />
      <rect x="0" y="8" width="120" height="6" fill="var(--color-bg-warm)" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={6 + i * 6} cy="7" r="1.6" fill="var(--color-border)" />
      ))}
      <rect x="28" y="4" width="60" height="6" rx="3" fill="var(--color-surface)" />
      {/* product card */}
      <motion.g
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <rect
          x="12"
          y="22"
          width="44"
          height="42"
          rx="4"
          fill="var(--color-bg-warm)"
          stroke="var(--color-border)"
          strokeWidth="0.5"
        />
        <rect x="16" y="26" width="36" height="20" rx="2" fill="var(--color-accent-soft)" />
        <rect x="16" y="50" width="22" height="3" rx="1.5" fill="var(--color-text)" opacity="0.6" />
        <rect x="16" y="56" width="14" height="3" rx="1.5" fill="var(--color-accent)" />
      </motion.g>
      {/* second product */}
      <rect
        x="62"
        y="22"
        width="44"
        height="42"
        rx="4"
        fill="var(--color-bg-warm)"
        stroke="var(--color-border)"
        strokeWidth="0.5"
        opacity="0.6"
      />
    </svg>
  );
}

/* Care — uptime-graph met live-pulse. */
function CarePreview({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="120" height="72" rx="8" fill="var(--color-bg-warm)" />
      {/* sparkline */}
      <motion.path
        d="M 8 50 L 22 44 L 36 48 L 50 38 L 64 42 L 78 32 L 92 36 L 106 28 L 112 30"
        stroke="var(--color-success)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {/* dots along line */}
      {[
        [22, 44],
        [50, 38],
        [78, 32],
        [106, 28],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="var(--color-success)" />
      ))}
      {/* live pulse */}
      <circle cx="106" cy="28" r="3.5" fill="var(--color-success)" opacity="0.25">
        {!reduce ? (
          <animate attributeName="r" values="3.5;7;3.5" dur="2.4s" repeatCount="indefinite" />
        ) : null}
      </circle>
      {/* uptime label */}
      <text
        x="8"
        y="20"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        fontWeight="500"
        fill="var(--color-text)"
      >
        99.98%
      </text>
      <text
        x="44"
        y="20"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        fill="var(--color-muted)"
      >
        uptime · 30d
      </text>
    </svg>
  );
}

/* Growth — kpi-tile met arrow + percentage. */
function GrowthPreview({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="120" height="72" rx="8" fill="var(--color-bg-warm)" />
      {/* bars */}
      {[
        [10, 20],
        [28, 28],
        [46, 22],
        [64, 36],
        [82, 30],
        [100, 44],
      ].map(([x, h], i) => (
        <motion.rect
          key={i}
          x={x}
          y={64 - h}
          width="10"
          height={h}
          rx="2"
          fill={i === 5 ? "var(--color-accent)" : "var(--color-accent-soft)"}
          initial={reduce ? false : { scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
          style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
        />
      ))}
      {/* trend arrow */}
      <motion.path
        d="M 10 56 L 100 24"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1, delay: 0.5 }}
        strokeDasharray="2 3"
      />
      <text
        x="80"
        y="14"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        fontWeight="600"
        fill="var(--color-accent)"
      >
        +24%
      </text>
    </svg>
  );
}
