"use client";

import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "@/components/shared/CountUp";
import { LivePulse } from "@/components/animate/LivePulse";

const START_YEAR = 2016;

export function HeroMeta({
  yearsLabel,
  uptimeLabel,
  regionLabel,
  regionValue,
  liveLabel,
}: {
  yearsLabel: string;
  uptimeLabel: string;
  regionLabel: string;
  regionValue: string;
  liveLabel: string;
}) {
  const reduce = useReducedMotion();
  const years = new Date().getFullYear() - START_YEAR;

  const items = [
    {
      key: "years",
      label: yearsLabel,
      value: <CountUp from={1} to={years} duration={1.6} suffix="+" />,
    },
    {
      key: "uptime",
      label: uptimeLabel,
      value: (
        <span>
          <CountUp from={99} to={99} duration={0.4} />
          <span className="text-(--color-muted)">.98%</span>
        </span>
      ),
    },
    {
      key: "region",
      label: regionLabel,
      value: regionValue,
    },
  ];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-(--color-border) bg-(--color-surface) px-5 py-4"
        >
          <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {item.label}
          </p>
          <p className="mt-1.5 font-serif text-3xl leading-none text-(--color-text)">
            {item.value}
          </p>
        </div>
      ))}
      {/* Fourth: live status — feels alive, not a fake stat. */}
      <div className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-bg-warm)/60 px-5 py-4">
        <LivePulse size={2.5} />
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {liveLabel}
          </p>
          <p className="mt-1 truncate text-sm font-medium">webstability.eu</p>
        </div>
      </div>
    </motion.div>
  );
}
