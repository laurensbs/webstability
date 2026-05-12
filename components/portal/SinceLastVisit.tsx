import { Activity, CheckCircle2, FileText, Sparkles } from "lucide-react";

type Activity = {
  ticketsClosed: number;
  invoicesNew: number;
  livegangs: number;
  incidents: number;
  incidentsResolved: number;
};

type Strings = {
  eyebrow: string;
  ticketClosedSingle: string;
  ticketClosedPlural: string;
  invoiceNewSingle: string;
  invoiceNewPlural: string;
  livegangSingle: string;
  livegangPlural: string;
  monitoringStable: string;
  incidentsAllResolved: string;
};

/**
 * "Wat is er veranderd"-strip onder de Greeting op /portal/dashboard.
 * Gerendered als één lichte rij rounded-pills. Niet-dismissable per item
 * (groep is al kort), wel verborgen als er nul zinnige items zijn.
 *
 * Caller filtert op `lastLoginAt < 24h` — geen herhaling als dezelfde
 * dag.
 */
export function SinceLastVisit({ activity, strings }: { activity: Activity; strings: Strings }) {
  const items: Array<{ icon: React.ElementType; label: string }> = [];

  if (activity.ticketsClosed > 0) {
    items.push({
      icon: CheckCircle2,
      label:
        activity.ticketsClosed === 1
          ? strings.ticketClosedSingle
          : strings.ticketClosedPlural.replace("{n}", String(activity.ticketsClosed)),
    });
  }

  if (activity.livegangs > 0) {
    items.push({
      icon: Sparkles,
      label:
        activity.livegangs === 1
          ? strings.livegangSingle
          : strings.livegangPlural.replace("{n}", String(activity.livegangs)),
    });
  }

  if (activity.invoicesNew > 0) {
    items.push({
      icon: FileText,
      label:
        activity.invoicesNew === 1
          ? strings.invoiceNewSingle
          : strings.invoiceNewPlural.replace("{n}", String(activity.invoicesNew)),
    });
  }

  // Monitoring-statement: alleen "stabiel" als er geen incidents waren,
  // of "alle X incidents opgelost" als alle resolved zijn.
  if (activity.incidents === 0) {
    items.push({ icon: Activity, label: strings.monitoringStable });
  } else if (activity.incidents === activity.incidentsResolved) {
    items.push({
      icon: Activity,
      label: strings.incidentsAllResolved.replace("{n}", String(activity.incidents)),
    });
  }

  if (items.length === 0) return null;

  return (
    <section
      aria-label={strings.eyebrow}
      className="rounded-card flex flex-wrap items-center gap-2 border border-(--color-border) bg-(--color-bg-warm) px-4 py-3"
    >
      <span className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {strings.eyebrow}
      </span>
      {items.map(({ icon: Icon, label }, i) => (
        <span
          key={`${i}-${label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-[12px] text-(--color-text)"
        >
          <Icon className="h-3 w-3 text-(--color-accent)" strokeWidth={2.2} />
          {label}
        </span>
      ))}
    </section>
  );
}
