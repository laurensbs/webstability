"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Drop-in replacement for AvailabilityPill that cycles through a set
 * of micro-messages every 4 seconds. The green dot stays static; only
 * the text crossfades + slides up.
 *
 * On reduced-motion the cycle stops and only the first message is
 * shown — no entry animation either, matching AvailabilityPill's own
 * fallback.
 */
export function RotatingPill({ href, messages }: { href: Href; messages: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduce || messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [reduce, messages.length]);

  const visible = messages[reduce ? 0 : index] ?? messages[0] ?? "";

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
        <span className="relative inline-block min-h-[1lh] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={visible}
              initial={reduce ? false : { y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: -8, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="block whitespace-nowrap"
            >
              {visible}
            </motion.span>
          </AnimatePresence>
        </span>
      </Link>
    </motion.span>
  );
}
