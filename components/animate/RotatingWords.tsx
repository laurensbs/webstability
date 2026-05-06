"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * In-line word cycler. Mounts a vertically-clipped span so the active
 * word slides up out of frame as the next one slides in from below.
 * Accent-italic by default to match the heading <em> treatment.
 *
 * On prefers-reduced-motion: just renders the first word, no cycling.
 */
export function RotatingWords({
  words,
  interval = 2500,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [reduce, words.length, interval]);

  if (reduce) {
    return <em className={`text-(--color-accent) ${className ?? ""}`}>{words[0]}</em>;
  }

  return (
    <span
      className={`relative inline-block overflow-hidden align-bottom ${className ?? ""}`}
      style={{ minWidth: "8ch" }}
    >
      <AnimatePresence mode="wait">
        <motion.em
          key={words[i]}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1] }}
          className="inline-block whitespace-nowrap text-(--color-accent)"
        >
          {words[i]}
        </motion.em>
      </AnimatePresence>
    </span>
  );
}
