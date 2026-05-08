"use client";

import * as React from "react";

/**
 * Sticky donker header. Bovenop pagina is de bar bijna transparant
 * met blur, bij scroll voorbij 12px wordt 'ie compacter en donkerder.
 * De donkere bar past bij de "studio after dark"-merkstem die ook op
 * /login terugkomt.
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
      className="sticky top-0 z-30 border-b border-(--color-text)/10 bg-(--color-text)/80 text-(--color-bg) backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-200 data-[scrolled]:border-(--color-text)/20 data-[scrolled]:bg-(--color-text)/95 data-[scrolled]:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.35)]"
    >
      {children}
    </header>
  );
}
