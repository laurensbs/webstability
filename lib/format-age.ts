/**
 * Server-side age-label voor admin-tickets-kanban. Geïsoleerd in een
 * eigen module zodat React's purity-rule niet trigger op Date.now()
 * binnen de page-component body.
 */
export function formatAgeLabel(
  createdAt: Date,
  templates: { days: (n: number) => string; hours: (n: number) => string },
): string {
  const ageMs = Date.now() - createdAt.getTime();
  const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  return days >= 1 ? templates.days(days) : templates.hours(Math.max(1, hours));
}

/**
 * Aantal dagen tot een toekomstige datum, gerounded. Negatief als
 * datum in het verleden ligt (call-site clampt naar 0). Apart helper
 * zodat React's purity-rule niet trigger.
 */
export function daysUntil(target: Date): number {
  return Math.round((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Datum N dagen in de toekomst — server-side helper buiten React-render
 * om purity-violations te vermijden. Demo-page gebruikt 'm voor faux
 * subscription periodEnd.
 */
export function dateInDays(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
