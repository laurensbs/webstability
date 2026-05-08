"use client";

import * as React from "react";

/**
 * Sticky donkere header. Bij scroll voorbij 12px transformt de bar:
 *  - Krimpt los van de viewport-randen (mx-3 + max-w-1100)
 *  - Krijgt rounded-full + lichte cream/15 border + shadow
 *  - Inner nav-padding compresseert (py-3.5 → py-2.5)
 * Linear/Framer-stijl floating pill. Honoreert prefers-reduced-motion
 * via de korte transition-duration die geen layout-jank introduceert.
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
        // Sticky outer wrapper — z-30 boven content, blijft top-0
        "sticky top-0 z-30 transition-[padding] duration-300 ease-out",
        // Op scroll: padding rondom om de pill "los" te laten zweven
        "data-[scrolled]:px-4 data-[scrolled]:pt-3",
        // Inner bar krijgt smooth alle transitions
        "[&>nav]:transition-all [&>nav]:duration-300 [&>nav]:ease-out",
        // Niet-scrolled — donkere bar, NEEM DE VOLLE BREEDTE: override
        // Navigation's eigen mx-auto max-w-6xl naar full-width.
        "[&>nav]:!max-w-none [&>nav]:bg-(--color-text) [&>nav]:text-(--color-bg)",
        "[&>nav]:border-b [&>nav]:border-transparent",
        // Scrolled — floating pill: nog steeds royaal breed (1280) maar
        // met margin-auto en pill-styling. Iets ruimer dan voorheen
        // zodat 'ie niet smal aanvoelt.
        "data-[scrolled]:[&>nav]:!mx-auto data-[scrolled]:[&>nav]:!max-w-[1280px]",
        "data-[scrolled]:[&>nav]:rounded-full data-[scrolled]:[&>nav]:border-(--color-bg)/15",
        "data-[scrolled]:[&>nav]:py-2 data-[scrolled]:[&>nav]:shadow-[0_12px_32px_-12px_rgba(31,27,22,0.45)]",
      ].join(" ")}
    >
      {children}
    </header>
  );
}
