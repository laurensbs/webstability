"use client";

import * as React from "react";

/**
 * Sticky donkere header met een fade-transitie tussen "full-width donker"
 * en "pill". Compositor-only (alleen opacity + border-color), nooit layout-
 * properties — vloeiend op elke device. Linear/Vercel doen het identiek.
 *
 * Hysterese (zie ENTER/LEAVE): de pill klapt IN voorbij 130px en pas weer
 * UIT onder 60px — voorkomt geflikker bij micro-scroll rond één drempel.
 * Bovenaan elke pagina is de header full-width donker; consistent op
 * pagina's mét en zónder grote hero.
 */
const ENTER_THRESHOLD = 130;
const LEAVE_THRESHOLD = 60;

/** Pill-staat met hysterese: boven LEAVE → uit, boven ENTER → in, ertussen
 * → blijf op de vorige staat. */
function nextScrolled(y: number, prev: boolean): boolean {
  if (y > ENTER_THRESHOLD) return true;
  if (y < LEAVE_THRESHOLD) return false;
  return prev;
}

function initialScrolled() {
  if (typeof window === "undefined") return false;
  // Direct deeplink halverwege de pagina → meteen pill-staat, geen "full-
  // width"-flash. De SSR-markup is altijd "niet gescrold"; deze lazy
  // useState-initializer corrigeert dat op de eerste client-render vóór paint.
  return window.scrollY > ENTER_THRESHOLD;
}

export function NavScroll({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(initialScrolled);

  React.useEffect(() => {
    let ticking = false;
    let lastValue = window.scrollY > ENTER_THRESHOLD;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = nextScrolled(window.scrollY, lastValue);
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

  // Premium expo-out, 420ms — sweet spot voor compositor-only animaties.
  // Bij reduced motion: instant snap (geen 420ms fade).
  const easing =
    "duration-[420ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0";

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
          zodat de pill ruim om de content valt. Inset-x voor marge tot de
          viewport-randen. */}
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

      {/* Laag 3 — inner content. Géén transform op deze laag: een sub-pixel
          translate/scale tijdens de transitie geeft wazige tekst in Safari/
          Chrome — de pill-fade alleen is genoeg "lift". */}
      <div className="relative text-(--color-bg)">{children}</div>
    </header>
  );
}
