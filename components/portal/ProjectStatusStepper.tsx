import { Check } from "lucide-react";

type Status = "planning" | "in_progress" | "review" | "live" | "done";

const ORDER: Exclude<Status, "done">[] = ["planning", "in_progress", "review", "live"];

/**
 * Horizontale fase-stepper op de project-detailpagina: planning → in
 * ontwikkeling → review → live. De huidige fase is terracotta-gevuld, eerdere
 * fases krijgen een vinkje, latere fases zijn gedimd. `done` valt onder "live"
 * (volledig afgevinkt). De verbindende lijn loopt exact van de eerste dot naar
 * de laatste — geen losse strepen (zelfde principe als BuildTimeline).
 *
 * Pure server-component — geen state, geen animatie. Strings via props zodat de
 * server-component de i18n levert.
 */
export function ProjectStatusStepper({
  status,
  strings,
}: {
  status: Status;
  strings: { steps: Record<Exclude<Status, "done">, string>; done: string; now: string };
}) {
  const currentIdx = status === "done" ? ORDER.length : ORDER.indexOf(status as never);
  const n = ORDER.length;
  const inset = `${100 / (n * 2)}%`;
  // De lijn vult tot het midden van de huidige fase (of helemaal vol bij done).
  const fillPct = currentIdx <= 0 ? 0 : currentIdx >= n ? 100 : (currentIdx / (n - 1)) * 100;

  return (
    <div className="relative">
      {/* Basislijn dot→dot */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[10px] h-px bg-(--color-border)"
        style={{ left: inset, right: inset }}
      />
      {/* Voortgangslijn (terracotta) tot de huidige fase */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[10px] h-px bg-(--color-accent) transition-[width] duration-500"
        style={{ left: inset, width: `calc((100% - ${inset} - ${inset}) * ${fillPct / 100})` }}
      />
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {ORDER.map((step, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          return (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                aria-hidden
                className={`grid h-[21px] w-[21px] place-items-center rounded-full border-2 text-[10px] ${
                  done
                    ? "border-(--color-accent) bg-(--color-accent) text-white"
                    : current
                      ? "border-(--color-accent) bg-(--color-bg-warm) text-(--color-accent)"
                      : "border-(--color-border) bg-(--color-surface) text-(--color-muted)"
                }`}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`font-mono text-[10px] tracking-wide uppercase ${
                  current
                    ? "text-(--color-accent)"
                    : done
                      ? "text-(--color-text)"
                      : "text-(--color-muted)"
                }`}
              >
                {strings.steps[step]}
              </span>
              {current ? (
                <span className="rounded-full bg-(--color-accent)/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-(--color-accent) uppercase">
                  {strings.now}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
