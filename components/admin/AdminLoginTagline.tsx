"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/**
 * Studio-cockpit tagline boven de admin-login form. Cycled door 3 live
 * studio-stats (orgs actief, MRR, open tickets) zodat het inloggen op
 * admin.webstability.eu meteen voelt als binnenkomen in je eigen
 * dashboard. Geen klik-CTA — puur context.
 *
 * Stats worden server-side in de page geprerendered en als prop
 * doorgegeven; component is puur visueel.
 */
export function AdminLoginTagline({ messages }: { messages: string[] }) {
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
    <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-(--color-bg)/65">
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: "var(--color-wine-soft)" }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--color-wine)" }}
        />
      </span>
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
    </span>
  );
}
