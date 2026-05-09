"use client";

import * as React from "react";

/**
 * Sticky donkere header met transform-based pill-transitie.
 *
 * Drie compositor-only lagen voor butter-smooth 60fps:
 *  1. Full-width donkere achtergrond (fade-out op scroll)
 *  2. Pill-frame binnen max-w-7xl wrapper (fade-in op scroll)
 *  3. Inner content met subtle transform (lift + krimp) op scroll
 *
 * Layout-properties (max-width, padding) zijn nooit getransitioneerd
 * — alleen opacity + transform = compositor-only = vloeiend op elke
 * device. Linear/Vercel doen het identiek.
 *
 * Threshold: pill verschijnt pas wanneer de hero voorbij is (~70%
 * viewport-height). Bovenop de pagina blijft de header full-width
 * donker zodat de hero z'n eigen visuele claim houdt.
 */
function initialScrolled() {
  if (typeof window === "undefined") return false;
  return window.scrollY > Math.max(280, window.innerHeight * 0.7);
}

export function NavScroll({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(initialScrolled);

  React.useEffect(() => {
    let ticking = false;
    // Threshold is 70% van viewport-hoogte — pas voorbij de hero.
    const getThreshold = () => Math.max(280, window.innerHeight * 0.7);
    let threshold = getThreshold();
    let lastValue = window.scrollY > threshold;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > threshold;
        if (next !== lastValue) {
          lastValue = next;
          setScrolled(next);
        }
        ticking = false;
      });
    };
    const onResize = () => {
      threshold = getThreshold();
      const next = window.scrollY > threshold;
      if (next !== lastValue) {
        lastValue = next;
        setScrolled(next);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Premium expo-out, 450ms — sweet spot voor compositor-only animaties
  const easing = "duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";

  return (
    <header data-scrolled={scrolled || undefined} className="sticky top-0 z-30">
      {/* Laag 1 — full-width donkere achtergrond, fade-out op scroll */}
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0 transform-gpu bg-(--color-text)",
          "transition-opacity",
          easing,
          scrolled ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />

      {/* Laag 2 — pill-frame, breder dan de inner-nav (max-w-7xl, 1280px)
          zodat de pill na de transform ruim om de content valt. Inset-x
          op 6 voor wat marge tot de viewport-randen. */}
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-7xl px-2">
        <span
          aria-hidden
          className={[
            "absolute inset-y-1.5 right-2 left-2 transform-gpu rounded-full border bg-(--color-text) shadow-[0_12px_32px_-12px_rgba(31,27,22,0.45)]",
            "transition-[opacity,border-color]",
            easing,
            scrolled ? "border-(--color-bg)/15 opacity-100" : "border-transparent opacity-0",
          ].join(" ")}
        />
      </div>

      {/* Laag 3 — inner content. translate-Y + scale = compositor-only,
          geen layout-recompute. */}
      <div
        className={[
          "relative transform-gpu text-(--color-bg) will-change-transform",
          "transition-transform",
          easing,
          scrolled ? "translate-y-1 scale-[0.985]" : "translate-y-0 scale-100",
        ].join(" ")}
      >
        {children}
      </div>
    </header>
  );
}
