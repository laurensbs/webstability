"use client";

import * as React from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Twee halo-blobs die subtiel meebewegen met de cursor — max ~10px
 * shift, sloom (spring met hoge damping) zodat het niet hyperactief
 * voelt. Op coarse-pointer (touch) blijven ze statisch via de
 * useReducedMotion + ontbrekende mouse-events automatisch.
 */
export function StudioParallaxHalos() {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  // Cursor-positie als motion values, genormaliseerd naar [-1, 1]
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Spring-smoothed varianten — voelt zwaarder, premium
  const sx = useSpring(mx, { stiffness: 80, damping: 24, mass: 1.5 });
  const sy = useSpring(my, { stiffness: 80, damping: 24, mass: 1.5 });

  // Halo 1 (terracotta linksboven) beweegt iets meer dan halo 2.
  const x1 = useTransform(sx, [-1, 1], [-12, 12]);
  const y1 = useTransform(sy, [-1, 1], [-8, 8]);
  const x2 = useTransform(sx, [-1, 1], [10, -10]);
  const y2 = useTransform(sy, [-1, 1], [6, -6]);

  React.useEffect(() => {
    if (reduce) return;
    // Event op section-parent attachen via parentElement — wrapper
    // heeft pointer-events-none zodat 'ie clicks op CTAs doorlaat.
    const el = ref.current?.parentElement;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mx.set((e.clientX - cx) / (rect.width / 2));
      my.set((e.clientY - cy) / (rect.height / 2));
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [mx, my, reduce]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      <motion.div
        aria-hidden
        style={{ x: x1, y: y1 }}
        className="wb-soft-halo absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-40 blur-3xl"
      />
      <motion.div
        aria-hidden
        style={{ x: x2, y: y2 }}
        className="wb-soft-halo absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-50 blur-3xl"
      />
    </div>
  );
}
