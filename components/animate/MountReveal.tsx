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

  // Touch-detectie: verandert alléén de animatie-timing (post-mount), niet de
  // eerste DOM-render (die is op beide opacity:0) — dus geen hydratie-mismatch.
  const [touch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });

  // De SSR-markup krijgt de verborgen begintoestand al via inline style, zodat
  // er geen flash is: zonder dit rendert de server het element zichtbaar, springt
  // hydratie 'm naar opacity:0, en animeert 'ie daarna pas in — dat las als
  // "tekst komt niet goed naar voor". Reduced-motion: gewoon zichtbaar laten.
  const hiddenStyle = reduce ? undefined : { opacity: 0 };

  // Op de telefoon: gestapelde delays tot 0.5s + 0.6s duur betekent dat het
  // laatste blok pas >1s na een toch al trage hydratie verschijnt. We cappen de
  // delay hard en korten de duur in — alles komt vrijwel tegelijk en snel.
  const effectiveDelay = touch ? Math.min(delay, 0.12) : delay;
  const duration = touch ? 0.35 : 0.6;

  return (
    <Tag
      style={hiddenStyle}
      initial={reduce ? false : { opacity: 0, y: touch ? 6 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay: effectiveDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
