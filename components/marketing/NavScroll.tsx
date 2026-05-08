"use client";

import * as React from "react";

/**
 * Sticky header. Bij scroll voorbij 12px verschijnt een subtiele
 * border + lichte glas-achtergrond — geen wijn-rode hairline of
 * prominente shadow, gewoon rustig.
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
      className="sticky top-0 z-30 border-b border-transparent bg-(--color-bg)/80 backdrop-blur-md transition-[border-color,background-color] duration-200 data-[scrolled]:border-(--color-border) data-[scrolled]:bg-(--color-bg)/95"
    >
      {children}
    </header>
  );
}
