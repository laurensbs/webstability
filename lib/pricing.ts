/**
 * Single source of truth voor alle tier- en build-prijzen die op de
 * site getoond worden. Voorkomt drift tussen messages/*.json en
 * componenten als de BuildCalculator.
 *
 * Stripe-zijde (price IDs in env) is bewust losgekoppeld: Stripe is
 * de fact, deze constants zijn alleen display.
 */

export type TierId = "care" | "studio" | "atelier";
export type BuildId = "none" | "light" | "standard" | "custom";

export const TIER_PRICES: Record<TierId, number> = {
  care: 95,
  studio: 179,
  atelier: 399,
};

export const BUILD_PRICES: Record<BuildId, number> = {
  none: 0,
  light: 349,
  standard: 499,
  custom: 899,
};

/**
 * Build-projectprijzen (éénmalig, display) — losgekoppeld van de
 * BUILD_PRICES hierboven (dat zijn de tijdelijke maand-add-ons tijdens
 * een build). Dit zijn de richtprijzen voor het bouwwerk zelf:
 * - Kleine site / landingpage: vanaf €1.050
 * - Webshop met BTW/IVA: vanaf €3.000
 * - Verhuur-boekingssysteem / klantportaal: €6.000–10.000
 *   (was €5–8k; verhoogd per strategie v2 — €5k signaleerde "goedkoop")
 *   De €5k-instap blijft voor kleine verhuur (1–5 objecten).
 */
export const BUILD_PROJECT_FLOORS = {
  site: 1050,
  webshop: 3000,
  rentalSystemMin: 6000,
  rentalSystemMax: 10000,
  rentalSmall: 5000,
} as const;

/**
 * Discovery-traject (betaald) — de brug tussen de gratis kennismakings-
 * call en de €6–10k build. We tekenen samen het proces uit, klant
 * krijgt een concreet plan + vaste offerte. Bij doorgang verrekend in
 * de build. Geen Stripe-product nodig — wordt handmatig gefactureerd
 * (of via een Stripe Payment Link als het volume omhoog gaat).
 */
export const DISCOVERY_PRICE_MIN = 500;
export const DISCOVERY_PRICE_MAX = 750;

/**
 * Care is per 2026-05 gesloten voor nieuwe instroom — anker, geen aanbod.
 * Het minimum-bedrag voor nieuwe contracten is €150/m. Studio (€179) is
 * de feitelijke instap-tier op /prijzen.
 */
export const ENTRY_TIER: TierId = "studio";
export const LEGACY_TIERS = new Set<TierId>(["care"]);

export function isLegacyTier(id: TierId): boolean {
  return LEGACY_TIERS.has(id);
}
1;
