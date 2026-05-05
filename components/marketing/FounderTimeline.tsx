"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const START_YEAR = 2016;

export function FounderTimeline({ label }: { label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);

  return (
    <div ref={ref} className="space-y-3">
      <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {years.map((year, i) => {
          const isLast = i === years.length - 1;
          return (
            <motion.span
              key={year}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`rounded-md border px-2.5 py-1 font-mono text-xs tabular-nums transition-colors ${
                isLast
                  ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-muted)"
              }`}
            >
              {year}
              {isLast ? " ←" : ""}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
