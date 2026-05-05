"use client";

import { motion, useReducedMotion } from "motion/react";

export function ApproachCard({
  index,
  kicker,
  title,
  body,
}: {
  index: number;
  kicker: string;
  title: string;
  body: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className="group relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-7 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]"
    >
      {/* Numbered dot — sits on the connecting rail behind the cards. */}
      <span
        aria-hidden
        className="absolute top-6 right-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg) font-mono text-[10px] tracking-widest text-(--color-muted) uppercase transition-colors duration-300 group-hover:border-(--color-accent) group-hover:bg-(--color-accent-soft) group-hover:text-(--color-accent)"
      >
        {kicker}
      </span>
      {/* Accent rule that grows from the left edge on hover. */}
      <span
        aria-hidden
        className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 bg-(--color-accent) transition-transform duration-500 ease-out group-hover:scale-y-100"
      />
      <h3 className="mt-2 text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{body}</p>
    </motion.article>
  );
}
