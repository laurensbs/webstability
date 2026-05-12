"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";

const SCRAMBLE_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`";

/**
 * Mono-font label that scrambles random ASCII before settling on its real
 * text. Used for `// eyebrow` style section tags. Respects reduced-motion
 * by rendering the final string with no animation at all.
 */
export function ScrambleText({
  text,
  duration = 700,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(() => (reduce ? text : " ".repeat(text.length)));

  React.useEffect(() => {
    if (!inView || reduce) return;
    let frame = 0;
    const totalFrames = Math.max(1, Math.floor(duration / 32));
    const id = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const reveal = Math.floor(text.length * progress);
      const out = text
        .split("")
        .map((c, i) => {
          if (i < reveal) return c;
          if (c === " ") return " ";
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join("");
      setDisplay(out);
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(id);
      }
    }, 32);
    return () => clearInterval(id);
  }, [inView, text, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
