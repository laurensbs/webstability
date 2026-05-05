"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";

export function CountUp({
  from,
  to,
  duration = 1.6,
  className,
  prefix,
  suffix,
}: {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(() => (reduce ? to : from));

  React.useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    const distance = to - from;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // ease-out cubic — fast start, soft landing.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + distance * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
