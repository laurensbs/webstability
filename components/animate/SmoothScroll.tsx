"use client";

import * as React from "react";
import Lenis from "lenis";

/**
 * Site-wide buttery scroll. Mounts once at the top of the marketing
 * layout. Honors prefers-reduced-motion by skipping initialization
 * entirely so native scroll stays untouched for users who asked for it.
 */
export function SmoothScroll() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
