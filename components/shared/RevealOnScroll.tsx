"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

function useTouchDevice() {
  const [touch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });
  return touch;
}

export function RevealOnScroll({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const touch = useTouchDevice();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  // On touch (mobile) we drop staggered delays and shorten the duration
  // so 30+ reveals don't pile up on the main thread during scroll.
  const duration = touch ? 0.3 : 0.6;
  const effectiveDelay = touch ? 0 : delay;

  // De SSR-markup krijgt de verborgen begintoestand al via inline style.
  // Zonder dit rendert de server het blok zichtbaar, springt hydratie 'm naar
  // opacity:0 en animeert 'ie daarna pas in — dat las als geflikker bij het
  // inladen van secties op mobiel.
  return (
    <motion.div
      className={className}
      style={{ opacity: 0 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration, delay: effectiveDelay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
