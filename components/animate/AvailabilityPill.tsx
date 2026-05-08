"use client";

import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * The "Beschikbaar voor 2 nieuwe projecten" pill at the top of the hero.
 * Springs in from scale 0.92 with the green dot box-shadow ring already
 * doing its own static glow. Honours reduced-motion (no scale-in).
 */
export function AvailabilityPill({ href, children }: { href: Href; children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-[13px] text-(--color-muted) shadow-[0_1px_2px_rgba(31,27,22,0.04),0_1px_3px_rgba(31,27,22,0.06)] transition-colors hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-(--color-success)"
          style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
        />
        {children}
      </Link>
    </motion.span>
  );
}
