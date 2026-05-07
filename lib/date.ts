/**
 * Locale-aware date helpers gebouwd op `Intl.RelativeTimeFormat` en
 * `Intl.DateTimeFormat`. Gebruik deze in plaats van handmatige
 * `toLocaleDateString()` calls zodat NL en ES consistent voelen.
 *
 * Pure functies — neem de "nu"-tijd als parameter zodat call-sites
 * Date.now() kunnen aanroepen buiten React-render-context (purity).
 */

const RANGES: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

/**
 * "3 dagen geleden", "over 2 weken", "vandaag" — auto-mapt naar de
 * grootste passende eenheid. Voor differences <30s returnt 'now-ish'.
 *
 * @param target Datum die we vergelijken
 * @param now    Reference-tijd (bv. Date.now() vooraf berekend)
 * @param locale BCP-47 (nl, es)
 */
export function formatRelative(target: Date, now: number, locale: string): string {
  const diff = target.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < 30 * 1000) {
    return locale === "es" ? "ahora" : "zojuist";
  }
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const { unit, ms } of RANGES) {
    if (abs >= ms || unit === "minute") {
      const value = Math.round(diff / ms);
      return fmt.format(value, unit);
    }
  }
  return fmt.format(0, "minute");
}

/**
 * Volledige datum, locale-aware. Default `medium` (15 mei 2026).
 */
export function formatDate(
  date: Date,
  locale: string,
  style: "short" | "medium" | "long" | "full" = "medium",
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(date);
}

/**
 * Datum + tijd, locale-aware. Voor incidents en activity-feeds waar
 * minuut-precisie ertoe doet.
 */
export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
