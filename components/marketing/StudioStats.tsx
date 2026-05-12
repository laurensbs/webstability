"use client";

import { motion, useReducedMotion } from "motion/react";
import { FlashCounter } from "@/components/animate/FlashCounter";

type StatItem = {
  label: string;
  /** Numerieke value voor count-up. Gebruik samen met `suffix` voor "10+", "%" etc. */
  value?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  /** Plain text als geen counter past (bijv. "NL · Spanje"). */
  plain?: string;
};

/**
 * Stat-strip met scroll-triggered stagger reveal + count-up tweens.
 * Boven de strip een dunne stroke-draw lijn die zichzelf trekt bij
 * scroll-in zodat de divider "actief" voelt ipv statische border.
 */
export function StudioStats({ stats }: { stats: StatItem[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="mt-12 pt-9">
      {/* Stroke-draw divider boven de stats */}
      <motion.svg
        className="absolute left-0 -mt-9 h-px w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 1"
        aria-hidden
      >
        <motion.line
          x1="0"
          y1="0.5"
          x2="100"
          y2="0.5"
          stroke="rgba(245,240,232,0.2)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>

      <div className="relative grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            data-reveal-on-scroll=""
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.5,
              delay: 0.15 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="font-serif text-[34px] leading-none text-(--color-bg) tabular-nums">
              {s.plain ? (
                s.plain
              ) : (
                <FlashCounter
                  to={s.value ?? 0}
                  suffix={s.suffix ?? ""}
                  prefix={s.prefix ?? ""}
                  decimals={s.decimals ?? 0}
                />
              )}
            </div>
            <div className="mt-1.5 font-mono text-[11px] tracking-widest text-(--color-bg)/55 uppercase">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
