"use client";

import { motion, useReducedMotion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Mini bar chart sparkline with deterministic dummy data — until the
 * Search Console integration is wired up the chart shows a "growing
 * trend" visual placeholder so the dashboard feels complete. Replace
 * the `bars` prop with real GSC data once the integration lands.
 */
const DEMO_BARS = [12, 18, 15, 22, 24, 28, 31, 27, 33, 38, 41, 45];

export function SeoSparkline({
  title,
  subtitle,
  delta,
  viewLabel,
  bars = DEMO_BARS,
}: {
  title: string;
  subtitle: string;
  delta: string;
  viewLabel: string;
  bars?: number[];
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...bars, 1);

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <div>
          <h2 className="text-base font-medium">{title}</h2>
          <p className="mt-0.5 font-mono text-[11px] text-(--color-muted)">{subtitle}</p>
        </div>
        <Link href="/portal/seo" className="font-mono text-xs text-(--color-accent)">
          {viewLabel} →
        </Link>
      </header>

      <div className="px-5 py-4">
        <div className="flex items-end gap-1.5" style={{ height: 64 }}>
          {bars.map((v, i) => {
            const h = Math.max(8, (v / max) * 60);
            return (
              <motion.span
                key={i}
                aria-hidden
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: h, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.05 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex-1 rounded-sm bg-gradient-to-t from-(--color-accent-soft) to-(--color-accent)"
                style={{ height: h }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-(--color-border) px-5 py-3.5">
        <span className="font-serif text-2xl tabular-nums">
          +{bars[bars.length - 1]! - bars[0]!}%
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-(--color-success)">
          <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
          {delta}
        </span>
      </div>
    </section>
  );
}
