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
 * Drempel: een vaste ~136px (zie SCROLL_THRESHOLD). Bovenaan elke pagina
 * blijft de header full-width donker; zodra je begint te scrollen klapt
 * hij in een pill. Consistent op pagina's mét en zónder grote hero.
 */
// Vaste drempel: zodra je een paar honderd pixels gescrold bent klapt
// de header in een pill. Bewust géén viewport-percentage meer — dat gaf
// een rare ervaring op pagina's zonder grote hero (blog-detail, prijzen,
// FAQ) waar de balk eerst eindeloos full-width donker bleef en dan plots
// insprong. Een vaste ~136px voelt op élke pagina kort en consistent.
const SCROLL_THRESHOLD = 136;

function initialScrolled() {
  if (typeof window === "undefined") return false;
  return window.scrollY > SCROLL_THRESHOLD;
}

export function NavScroll({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(initialScrolled);

  React.useEffect(() => {
    let ticking = false;
    let lastValue = window.scrollY > SCROLL_THRESHOLD;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > SCROLL_THRESHOLD;
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
            "shadow-modal absolute inset-y-1.5 right-2 left-2 transform-gpu rounded-full border bg-(--color-text)",
            "transition-[opacity,border-color]",
            easing,
            scrolled ? "border-(--color-bg)/15 opacity-100" : "border-transparent opacity-0",
          ].join(" ")}
        />
      </div>

      {/* Laag 3 — inner content. Alleen translate-Y (geen scale): tekst
          1.5% downscalen op scroll geeft sub-pixel-blur in Safari/Chrome —
          niet de moeite waard voor zo'n klein effect. translate is schoon.
          Géén permanente will-change (eigen compositor-layer = wazige tekst);
          transform-gpu (translateZ(0)) promoot 'm al tijdens de transitie. */}
      <div
        className={[
          "relative transform-gpu text-(--color-bg)",
          "transition-transform",
          easing,
          scrolled ? "translate-y-0.5" : "translate-y-0",
        ].join(" ")}
      >
        {children}
      </div>
    </header>
  );
}
