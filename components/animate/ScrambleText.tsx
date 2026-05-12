"use client";

import * as React from "react";
import { useInView } from "motion/react";

const SCRAMBLE_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`";

/**
 * Mono-font label that scrambles random ASCII before settling on its real
 * text. Used for `// eyebrow` style section tags.
 *
 * Belangrijk: de eerste render (zowel SSR als hydratie) toont de échte tekst —
 * géén lege spaties of random chars. Dat voorkomt (a) een flash van leeg→garbage
 * →echt op elke pagina-load, (b) een hydratie-mismatch, (c) onleesbare tekst voor
 * crawlers. Het scramble-effect start pas ná hydratie via een effect, alleen op
 * non-touch met motion aan — op de telefoon is het pure main-thread-kost tijdens
 * het zwaarste moment (hydratie) en leest het als geflikker.
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
  const [display, setDisplay] = React.useState(text);

  React.useEffect(() => {
    if (!inView) return;
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (prefersReduced || isTouch) return;

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
  }, [inView, text, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
