"use client";

import * as React from "react";

/**
 * Sticky donker header. Volledig donker vanaf scroll 0 — past bij de
 * "studio after dark"-merkstem die ook op /login terugkomt. Bij scroll
 * voorbij 12px voegen we alleen een lichte border + shadow toe als
 * subtiele depth-cue.
 */
export function NavScroll({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.scrollY > 12;
  });

  React.useEffect(() => {
    let ticking = false;
    let lastValue = window.scrollY > 12;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > 12;
        if (next !== lastValue) {
          lastValue = next;
          setScrolled(next);
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-30 border-b border-transparent bg-(--color-text) text-(--color-bg) transition-[border-color,box-shadow] duration-200 data-[scrolled]:border-(--color-bg)/15 data-[scrolled]:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.45)]"
    >
      {children}
    </header>
  );
}
