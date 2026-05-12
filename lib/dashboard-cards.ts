// Welke optionele kaarten een klant op het portal-dashboard ziet, als
// functie van het pakket. Eén plek i.p.v. losse `showX`-booleans verspreid
// door de dashboard-page — voeg later een kaart toe of verschuif een tier-
// grens hier, niet in de JSX.
//
// De pakket-grenzen:
//  - care:    alleen het kale set (voortgang/tickets/facturen/uren/security).
//  - studio:  + SEO-sparkline + uitgebreide monitoring + maandrapport-banner.
//  - atelier: + mini-roadmap (active/shipped/next).
// 'other' / geen pakket → behandeld als care.

import type { TierId } from "@/lib/pricing";

export type DashboardCards = {
  /** SEO-trend-sparkline (Studio+). */
  seo: boolean;
  /** Mini-roadmap met active/shipped/next-projecten (Atelier). */
  roadmap: boolean;
  /** Bij Care: een nudge "upgrade naar Studio voor monitoring + SEO". */
  upgradeNudge: boolean;
};

export function cardsForDashboard(plan: TierId | null | undefined): DashboardCards {
  const isStudioPlus = plan === "studio" || plan === "atelier";
  return {
    seo: isStudioPlus,
    roadmap: plan === "atelier",
    upgradeNudge: !isStudioPlus,
  };
}
