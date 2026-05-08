"use client";

import * as React from "react";

/**
 * Sticky donkere header met scroll-driven pill-transformatie.
 *
 * Premium-tuning:
 *  - Specifieke `transition-property` ipv `transition-all` — voorkomt
 *    dat ongewenste properties (border-radius, transform, etc.)
 *    mee-animeren en houdt de browser-paint pipeline kort.
 *  - Border-radius snapt direct (geen 0 → 9999px logaritmische lelijke
 *    interpolatie) — Linear/Framer doen dit ook zo.
 *  - `transform-gpu` tilt de header naar een eigen GPU-layer zodat
 *    compositing niet vecht met page-content eronder.
 *  - 550ms expo-out — sweet spot tussen "instant" (te snap) en "trage
 *    drag" (voelt schokkerig op layout-properties).
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
      className={[
        // Outer — alleen padding-transition voor "loslaten van rand"
        "sticky top-0 z-30 transform-gpu",
        "transition-[padding] duration-[550ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        "data-[scrolled]:px-4 data-[scrolled]:pt-3",
        // Inner — specifieke properties (max-width, padding, border-color, shadow)
        // Border-radius en transform NIET in de transition zodat ze direct snappen.
        "[&>nav]:transform-gpu [&>nav]:will-change-[max-width]",
        "[&>nav]:[transition-property:max-width,padding-top,padding-bottom,border-color,box-shadow]",
        "[&>nav]:duration-[550ms] [&>nav]:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        // Niet-scrolled — full-width donker
        "[&>nav]:!max-w-none [&>nav]:bg-(--color-text) [&>nav]:text-(--color-bg)",
        "[&>nav]:border [&>nav]:border-transparent",
        // Scrolled — pill 1280, rounded-full direct (geen interpolatie)
        "data-[scrolled]:[&>nav]:!mx-auto data-[scrolled]:[&>nav]:!max-w-[1280px]",
        "data-[scrolled]:[&>nav]:rounded-full data-[scrolled]:[&>nav]:border-(--color-bg)/15",
        "data-[scrolled]:[&>nav]:py-2 data-[scrolled]:[&>nav]:shadow-[0_12px_32px_-12px_rgba(31,27,22,0.45)]",
      ].join(" ")}
    >
      {children}
    </header>
  );
}
