"use client";

import * as React from "react";

/**
 * De klassieke "je kijkt onder de motorkap, leuk"-knipoog in de console.
 * Mount één keer in de marketing-layout. Print één keer per page-load
 * (ref-guard), niets in productie-logs — alleen in de devtools van wie
 * 'm opent. Geen tracking, geen ruis, gewoon een persoonlijke noot:
 * de site is van een mens, niet van een template.
 */
export function ConsoleWink() {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    try {
      const accent = "color:#C9614F;font-weight:bold;";
      const muted = "color:#6B645A;";
      console.log(
        "%cHoi 👋 %cje kijkt onder de motorkap.\n" +
          "%cDeze site is gebouwd door Laurens — één persoon, Next.js, vanuit de Costa Brava.\n" +
          "Code in mijn GitHub, geen template, geen bureau. Vragen of zin om iets te bouwen?\n" +
          "→ hello@webstability.eu  ·  https://webstability.eu/contact",
        accent,
        muted,
        muted,
      );
    } catch {
      // console niet beschikbaar — geen ramp
    }
  }, []);

  return null;
}
