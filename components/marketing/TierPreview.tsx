"use client";

import { motion, useReducedMotion } from "motion/react";

type TierId = "care" | "studio" | "atelier";

/**
 * Mini-widget per pricing-tier — toont concreet wat je krijgt voor je
 * geld, zonder de feature-list te dupliceren. CSS+SVG, geen externe
 * assets. Decorative (aria-hidden) zit onder de feature-list.
 */
export function TierPreview({ id, featured }: { id: TierId; featured?: boolean }) {
  const reduce = useReducedMotion();
  if (id === "care") return <CarePreview reduce={Boolean(reduce)} featured={featured} />;
  if (id === "studio") return <StudioPreview reduce={Boolean(reduce)} featured={featured} />;
  return <AtelierPreview reduce={Boolean(reduce)} featured={featured} />;
}

function bgClass(featured?: boolean) {
  return featured ? "bg-(--color-bg)/8" : "bg-(--color-bg-warm)";
}

function textClass(featured?: boolean) {
  return featured ? "text-(--color-bg)/85" : "text-(--color-text)";
}

function mutedClass(featured?: boolean) {
  return featured ? "text-(--color-bg)/55" : "text-(--color-muted)";
}

/* Care — monitoring-card thumbnail */
function CarePreview({ reduce, featured }: { reduce: boolean; featured?: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-xl border border-(--color-border)/40 ${bgClass(featured)} px-4 py-3`}
    >
      <p
        className={`mb-2 font-mono text-[10px] tracking-[0.1em] uppercase ${mutedClass(featured)}`}
      >
        Live monitoring
      </p>
      <div className="flex items-baseline gap-2">
        <span className="relative inline-flex h-2 w-2">
          {!reduce ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
          ) : null}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-success)" />
        </span>
        <span className={`font-serif text-2xl ${textClass(featured)}`}>99.98%</span>
        <span className={`text-[11px] ${mutedClass(featured)}`}>uptime · 30d</span>
      </div>
      {/* mini-bars */}
      <div className="mt-2 flex h-3 items-end gap-[2px]">
        {Array.from({ length: 30 }).map((_, i) => {
          const height = i === 14 ? 30 : i === 22 ? 60 : 100;
          return (
            <motion.span
              key={i}
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.015 }}
              className={`block w-[3px] rounded-sm ${i === 14 || i === 22 ? "bg-(--color-accent)" : "bg-(--color-success)"}`}
              style={{ height: `${height}%`, transformOrigin: "bottom" }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* Studio — mini-analytics: sparkline + ticket-counter */
function StudioPreview({ reduce, featured }: { reduce: boolean; featured?: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-xl border border-(--color-border)/40 ${bgClass(featured)} px-4 py-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`mb-1 font-mono text-[10px] tracking-[0.1em] uppercase ${mutedClass(featured)}`}
          >
            Bezoeken / week
          </p>
          <p className={`font-serif text-2xl ${textClass(featured)}`}>
            1.847
            <span className={`ml-2 text-[11px] font-medium text-(--color-accent)`}>+24%</span>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-accent)/15 px-2 py-0.5 text-[10px] font-medium text-(--color-accent)`}
        >
          3 open tickets
        </span>
      </div>
      {/* sparkline */}
      <svg viewBox="0 0 200 30" className="mt-2 h-6 w-full" preserveAspectRatio="none">
        <motion.path
          d="M 0 22 L 22 18 L 44 24 L 66 14 L 88 18 L 110 12 L 132 16 L 154 8 L 176 10 L 200 4"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.path
          d="M 0 22 L 22 18 L 44 24 L 66 14 L 88 18 L 110 12 L 132 16 L 154 8 L 176 10 L 200 4 L 200 30 L 0 30 Z"
          fill="var(--color-accent)"
          opacity="0.1"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />
      </svg>
    </div>
  );
}

/* Atelier — kanban-mini + active-build pill */
function AtelierPreview({ reduce, featured }: { reduce: boolean; featured?: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-xl border border-(--color-border)/40 ${bgClass(featured)} px-4 py-3`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className={`font-mono text-[10px] tracking-[0.1em] uppercase ${mutedClass(featured)}`}>
          Actieve roadmap
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-(--color-wine)/15 px-2 py-0.5 text-[10px] font-medium text-(--color-wine)">
          <span className="relative inline-flex h-1.5 w-1.5">
            {!reduce ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-wine) opacity-50" />
            ) : null}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-wine)" />
          </span>
          47d build
        </span>
      </div>
      {/* mini kanban */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { col: "in_progress", count: 2 },
          { col: "review", count: 1 },
          { col: "done", count: 4 },
        ].map((c, i) => (
          <div
            key={c.col}
            className="rounded-md border border-(--color-border)/40 bg-(--color-surface)/60 px-1.5 py-1.5"
          >
            <p className={`text-[8px] tracking-[0.1em] uppercase ${mutedClass(featured)}`}>
              {c.col === "in_progress" ? "Bezig" : c.col === "review" ? "Review" : "Live"}
            </p>
            <div className="mt-1 space-y-0.5">
              {Array.from({ length: c.count }).map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={reduce ? false : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (i * 3 + idx) * 0.05 }}
                  className="h-1 rounded-sm bg-(--color-accent)/40"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
