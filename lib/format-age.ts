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
