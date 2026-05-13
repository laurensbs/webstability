import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";

type HoursEntry = {
  id: string;
  description: string;
  minutes: number;
  workedOn: Date;
};

/**
 * "X van Y uur gebruikt deze maand"-widget. Verschijnt op het portal
 * dashboard voor elke tier (Care/Studio/Atelier hebben respectievelijk
 * 1u/3u/8u). Naast de progress-bar tonen we de laatste paar regels
 * werk zodat de klant ziet *waar* zijn uren naartoe gingen — geen
 * abstract getal, wel concreet "Security update Q2".
 */
export function HoursWidget({
  used,
  budget,
  recent,
  strings,
  alwaysOnItems,
}: {
  /** Total minutes used this month. */
  used: number;
  /** Total minutes available. 0 if no plan / unknown. */
  budget: number;
  /** Up to ~3 recent entries to render in the list. */
  recent: HoursEntry[];
  strings: {
    title: string;
    monthLabel: string;
    usedLabel: string;
    budgetLabel: string;
    recentTitle: string;
    empty: string;
    viewAll: string;
    alwaysOnTitle?: string;
  };
  /** Verschijnt onder de empty-state: korte lijst van wat er *altijd* loopt
   * (monitoring, security-updates, backups) — zodat 'niets gelogd' niet
   * leest als 'niets gebeurt'. Geen banner, geen sales — alleen reminder. */
  alwaysOnItems?: string[];
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  const usedHours = (used / 60).toFixed(1);
  const budgetHours = (budget / 60).toFixed(0);
  // Trim "0.0" naar "0" voor de gebruikssituatie waar nog niets gelogd is.
  const usedDisplay = used === 0 ? "0" : usedHours;

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
          <h2 className="text-base font-medium">{strings.title}</h2>
        </div>
        <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {strings.monthLabel}
        </span>
      </header>

      <div className="space-y-4 p-5">
        {/* Progress + numbers */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="text-(--color-muted)">
              <span className="font-serif text-[28px] leading-none text-(--color-text)">
                {usedDisplay}
              </span>
              <span className="ml-1 text-(--color-muted)">
                / {budgetHours}u {strings.usedLabel}
              </span>
            </span>
            <span
              className={`font-mono text-[11px] tracking-widest uppercase ${
                pct >= 100
                  ? "text-(--color-accent)"
                  : pct >= 80
                    ? "text-(--color-wine)"
                    : "text-(--color-muted)"
              }`}
            >
              {pct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-(--color-bg-warm)" aria-hidden>
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                pct >= 100 ? "bg-(--color-accent)" : "bg-(--color-success)"
              }`}
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
        </div>

        {/* Recent entries */}
        <div className="space-y-2 border-t border-(--color-border) pt-4">
          <h3 className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.recentTitle}
          </h3>
          {recent.length === 0 ? (
            <div className="space-y-3">
              <p className="text-[13px] text-(--color-muted)">{strings.empty}</p>
              {alwaysOnItems && alwaysOnItems.length > 0 ? (
                <div className="border-t border-(--color-border) pt-3">
                  {strings.alwaysOnTitle ? (
                    <p className="mb-1.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                      {strings.alwaysOnTitle}
                    </p>
                  ) : null}
                  <ul className="space-y-1">
                    {alwaysOnItems.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[12px] text-(--color-text)/80"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-(--color-success)"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {recent.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <p className="min-w-0 flex-1 truncate text-(--color-text)">{e.description}</p>
                  <span className="shrink-0 font-mono text-[11px] text-(--color-accent)">
                    {e.minutes}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {recent.length > 0 ? (
          <Link
            href="/portal/projects"
            className="inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase"
          >
            {strings.viewAll} →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
