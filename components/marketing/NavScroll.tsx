"use client";

import * as React from "react";

/**
 * Sticky header wrapper that adds a subtle shadow / tighter background
 * once the user scrolls past 12px. Mirrors the mockup's `.scrolled`
 * state without re-implementing the full nav inside a client component.
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
      className="sticky top-0 z-30 border-b border-transparent bg-(--color-bg)/80 backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-200 data-[scrolled]:border-(--color-border) data-[scrolled]:bg-(--color-bg)/95 data-[scrolled]:shadow-[0_1px_0_rgba(229,221,204,0.6),0_8px_24px_-12px_rgba(31,27,22,0.08)]"
    >
      {children}
    </header>
  );
}
