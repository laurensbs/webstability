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
 * Care is per 2026-05 gesloten voor nieuwe instroom — anker, geen aanbod.
 * Het minimum-bedrag voor nieuwe contracten is €150/m. Studio (€179) is
 * de feitelijke instap-tier op /prijzen.
 */
export const ENTRY_TIER: TierId = "studio";
export const LEGACY_TIERS = new Set<TierId>(["care"]);

export function isLegacyTier(id: TierId): boolean {
  return LEGACY_TIERS.has(id);
}
