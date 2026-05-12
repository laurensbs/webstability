"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

/**
 * Fade+lift wanneer het blok in beeld scrollt.
 *
 * Mobiel/touch: zie globals.css — `[data-reveal-on-scroll]` krijgt daar via
 * `@media (pointer: coarse)` meteen `opacity:1; transform:none`. Dat doen we
 * met CSS i.p.v. een JS-touch-check, want JS-detectie geeft een hydratie-mismatch
 * (server weet niet of het touch is) en dus alsnog een flits. Met de CSS-override
 * rendert server én client identieke markup; op de telefoon is het blok gewoon
 * direct zichtbaar — geen lege secties tot de JS laadt, geen geflikker.
 */
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

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      data-reveal-on-scroll=""
      className={className}
      style={{ opacity: 0 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
