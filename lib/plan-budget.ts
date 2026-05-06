/**
 * Maandelijks uren-budget per Care-tier. Komt overeen met de pricing
 * page: Care = 1u, Studio = 3u, Atelier = 8u. Build extensions tellen
 * niet mee — die hebben hun eigen ureninvestering die gebonden is aan
 * de bouwperiode (4u/10u/20u extra). Voor de portal-widget is alleen
 * de basis-tier relevant.
 */
export const TIER_HOURS_BUDGET = {
  care: 1,
  studio: 3,
  atelier: 8,
} as const;

export type TierId = keyof typeof TIER_HOURS_BUDGET;

export function budgetMinutesFor(plan: string | null | undefined): number {
  if (!plan) return 0;
  const hours = TIER_HOURS_BUDGET[plan as TierId];
  return hours ? hours * 60 : 0;
}
