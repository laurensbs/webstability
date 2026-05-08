"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

/**
 * Direct-on-mount reveal — fade + lift met optionele delay. Ander
 * gebruik dan RevealOnScroll: dit fire't bij eerste paint zonder
 * viewport-trigger. Bedoeld voor above-the-fold content op pagina's
 * waar de gebruiker al weet dat 'ie er is (login, contact, etc).
 *
 * Honoreert prefers-reduced-motion.
 */
export function MountReveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
