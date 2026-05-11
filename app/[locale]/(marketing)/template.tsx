"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Lichte route-transitie voor de marketing-surface — een korte fade(+slide)
 * bij elke pagina-wissel, zodat van-pagina-naar-pagina-klikken aanvoelt als
 * één product i.p.v. losse pagina's. Bewust subtiel: 220ms, kleine y-shift,
 * en met prefers-reduced-motion alleen opacity (geen beweging).
 *
 * Een `template.tsx` (i.p.v. `layout.tsx`) re-mount bij elke navigatie,
 * dus dit triggert vanzelf per route. De Hero-animaties op de homepage
 * blijven daarna gewoon spelen — die starten op hun eigen mount.
 */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
