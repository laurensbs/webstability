"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Live-status pill in de nav rechts. Cycleert door 3 micro-messages
 * (uptime, server-status, beschikbaarheid) elke 5s zodat het niet
 * een statisch "live"-tekstje is maar een klein levensteken naast de
 * primary CTA. Linkt naar /status. Reduced-motion → eerste message
 * blijft staan, geen cycling.
 */
export function NavLiveBadge({ messages, href = "/status" }: { messages: string[]; href?: Href }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduce || messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reduce, messages.length]);

  const visible = messages[reduce ? 0 : index] ?? messages[0] ?? "";

  return (
    <Link
      href={href}
      className="hidden items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:border-(--color-success)/40 hover:text-(--color-text) lg:inline-flex"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-success)"
        style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
      />
      <span className="relative inline-block min-h-[1lh] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible}
            initial={reduce ? false : { y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: -6, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="block whitespace-nowrap"
          >
            {visible}
          </motion.span>
        </AnimatePresence>
      </span>
    </Link>
  );
}
