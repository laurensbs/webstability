"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Subtiele scroll-parallax-wrapper rond de hero-mockup: terwijl je de hero uit
 * beeld scrollt drijft de kaart ~28px naar boven. Transform-only (compositor),
 * `md+` only (hero-mockup is sowieso `hidden lg:block`), reduced-motion → niets.
 * Géén opacity/blur — alleen een rustige drift, geen "effect".
 */
export function HeroMockupParallax({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -28]);

  if (reduce) return <div ref={ref}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
}
