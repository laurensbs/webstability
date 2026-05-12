"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

function useLiveTime(timeZone: string) {
  const [now, setNow] = React.useState<string | null>(null);
  React.useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

export function AudienceVisual({
  nlLabel,
  esLabel,
  tzLabel,
}: {
  nlLabel: string;
  esLabel: string;
  tzLabel: string; // e.g. "nu op de Costa Brava" / "ahora en la Costa Brava"
}) {
  const reduce = useReducedMotion();
  // Both NL and ES sit in CET — single clock is honest.
  const time = useLiveTime("Europe/Madrid");

  return (
    <motion.div
      data-reveal-on-scroll=""
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-(--color-border) bg-(--color-bg-warm)/60 p-4">
          <div className="text-3xl">🇳🇱</div>
          <p className="mt-2 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {nlLabel}
          </p>
        </div>
        <div className="rounded-md border border-(--color-border) bg-(--color-bg-warm)/60 p-4">
          <div className="text-3xl">🇪🇸</div>
          <p className="mt-2 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {esLabel}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-md border border-(--color-border) bg-(--color-bg) px-4 py-3">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {tzLabel}
        </p>
        <p className="font-serif text-2xl text-(--color-accent) tabular-nums">{time ?? "—"}</p>
      </div>
    </motion.div>
  );
}
