"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Number that flashes through every integer between a starting value and
 * the target the moment it scrolls into view. Faster and snappier than the
 * old CountUp — eases out via cubic so the last few values land softly.
 *
 * Decimals are preserved when `decimals` > 0 so "99.98%" still works.
 */
export function FlashCounter({
  to,
  from = 0,
  duration,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  from?: number;
  /** ms — defaults: 800 for n<100, 1400 for n>=100 */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(() => (reduce ? to : from));

  const ms = duration ?? (Math.abs(to) >= 100 ? 1400 : 800);

  React.useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      // ease-out cubic — fast in, gentle landing
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, ms, reduce]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
