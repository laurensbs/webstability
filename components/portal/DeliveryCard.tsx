import { Rocket } from "lucide-react";

type Phase = {
  extension: "light" | "standard" | "custom";
  startedAt: Date;
  endsAt: Date;
  durationMonths: number;
  label: string;
  /** Pre-computed elapsed-percentage (0–100) — caller berekent dit
   * met een server-side timestamp om purity-rules te respecteren. */
  pct: number;
  /** Pre-computed days remaining (negative = overdue). */
  daysRemaining: number;
  project?: { id: string; name: string; status: string; progress: number } | null;
};

/**
 * Prominente delivery-timeline kaart op het portal-dashboard wanneer
 * een organisatie een actieve Build-extension heeft. Toont de naam
 * van het project, hoeveel maanden van de build voorbij zijn, en
 * een visuele progress-bar tussen start en einde.
 *
 * Bedoeld als geruststelling — de klant ziet zwart-op-wit dat de
 * Build-add-on op de afgesproken einddatum vanzelf afloopt en hij
 * dan terug valt op zijn reguliere abonnement.
 */
export function DeliveryCard({
  phase,
  strings,
}: {
  phase: Phase;
  strings: {
    title: string;
    extensionLabel: Record<Phase["extension"], string>;
    monthsRemaining: string;
    daysRemaining: string;
    overdueLabel: string;
    started: string;
    ends: string;
    after: string;
    pctLabel: string;
  };
}) {
  const pct = phase.pct;
  const overdue = phase.daysRemaining < 0;
  const daysRemaining = Math.max(0, phase.daysRemaining);
  const monthsRemaining = Math.round(daysRemaining / 30);

  const dateFmt = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" });

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-accent)/40 bg-(--color-bg-warm)">
      <header className="flex items-center justify-between border-b border-(--color-accent)/20 px-5 py-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
          <h2 className="text-base font-medium">{strings.title}</h2>
        </div>
        <span className="rounded-full bg-(--color-accent) px-2.5 py-1 font-mono text-[10px] tracking-widest text-white uppercase">
          {strings.extensionLabel[phase.extension]}
        </span>
      </header>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-[18px] leading-tight font-medium">{phase.label}</p>
          {phase.project ? (
            <p className="mt-1 font-mono text-[11px] text-(--color-muted)">
              {phase.project.name}
              {phase.project.progress > 0 ? ` · ${phase.project.progress}%` : ""}
            </p>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-serif text-[28px] leading-none">
              {overdue ? strings.overdueLabel : monthsRemaining}
              {!overdue ? (
                <span className="ml-1 font-sans text-[13px] text-(--color-muted)">
                  {monthsRemaining === 1 ? strings.monthsRemaining : strings.monthsRemaining}
                  {monthsRemaining < 1 ? ` · ${daysRemaining} ${strings.daysRemaining}` : ""}
                </span>
              ) : null}
            </span>
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {pct}% {strings.pctLabel}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-(--color-surface)" aria-hidden>
            <div
              className="h-full rounded-full bg-(--color-accent) transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
        </div>

        {/* Start + einde + after */}
        <dl className="grid grid-cols-2 gap-4 border-t border-(--color-accent)/20 pt-4 text-[12px]">
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {strings.started}
            </dt>
            <dd className="mt-1 text-(--color-text)">{dateFmt.format(phase.startedAt)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {strings.ends}
            </dt>
            <dd className="mt-1 text-(--color-text)">{dateFmt.format(phase.endsAt)}</dd>
          </div>
        </dl>

        <p className="border-t border-(--color-accent)/20 pt-4 text-[13px] leading-[1.5] text-(--color-muted)">
          {strings.after}
        </p>
      </div>
    </section>
  );
}
