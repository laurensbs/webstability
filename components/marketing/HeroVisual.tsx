"use client";

import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "@/components/shared/CountUp";

export function HeroVisual({
  yearsLabel,
  sinceLabel,
  liveLabel,
}: {
  yearsLabel: string; // "jaar bouwen" / "años construyendo"
  sinceLabel: string; // "sinds" / "desde"
  liveLabel: string; // "live nu" / "en línea"
}) {
  const reduce = useReducedMotion();
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10;

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-stretch">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) px-6 py-5"
      >
        <div className="flex items-baseline gap-3">
          <CountUp
            from={1}
            to={10}
            duration={1.6}
            className="font-serif text-5xl leading-none text-(--color-accent)"
          />
          <span className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {yearsLabel}
          </span>
        </div>
        <p className="mt-3 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {sinceLabel}{" "}
          <CountUp
            from={startYear}
            to={currentYear}
            duration={1.6}
            className="text-(--color-text)"
          />
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-bg-warm)/60 px-6 py-5"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-success)" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {liveLabel}
          </p>
          <p className="truncate text-sm">
            webstability.eu · uptime{" "}
            <CountUp from={99} to={100} duration={1.4} className="font-medium" suffix="%" />
          </p>
        </div>
      </motion.div>
    </div>
  );
}
