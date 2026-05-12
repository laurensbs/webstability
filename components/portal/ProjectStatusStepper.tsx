import { Check } from "lucide-react";
import { PHASES_BY_KIND, type ServiceKind } from "@/lib/service-kinds";

type Status = "planning" | "in_progress" | "review" | "live" | "done";

/**
 * Horizontale fase-stepper op de project-detailpagina. De fasen verschillen per
 * dienst-type (PHASES_BY_KIND): een website doet ontwerp→bouw→review→live, een
 * webshop heeft daar nog "productdata & betalingen" + "testbestellingen" tussen,
 * een platform begint met "discovery". De huidige fase is terracotta-gevuld + een
 * "nu"-label, eerdere fases krijgen een vinkje, latere zijn gedimd. De verbindende
 * lijn loopt exact van de eerste dot naar de laatste — geen losse strepen.
 *
 * `project.status` (planning|in_progress|review|live|done) heeft niet de
 * granulariteit van alle tussenstappen; we mappen 'm op de fase met de
 * bijbehorende key (of de eerste/op-één-na-laatste/laatste als die er niet is).
 *
 * Pure server-component.
 */
export function ProjectStatusStepper({
  status,
  serviceKind,
  strings,
}: {
  status: Status;
  serviceKind: ServiceKind;
  strings: { now: string };
}) {
  const phases = PHASES_BY_KIND[serviceKind] ?? PHASES_BY_KIND.other;
  const n = phases.length;

  // Welke fase-index is "nu"? planning → de planning-key; in_progress → de
  // in_progress-key; review → de review-key (of n-2); live/done → n-1.
  const idxOfKey = (key: string) => phases.findIndex((p) => p.key === key);
  const currentIdx =
    status === "live" || status === "done"
      ? n - 1
      : status === "review"
        ? idxOfKey("review") >= 0
          ? idxOfKey("review")
          : n - 2
        : status === "in_progress"
          ? idxOfKey("in_progress") >= 0
            ? idxOfKey("in_progress")
            : 1
          : Math.max(0, idxOfKey("planning"));

  const inset = `${100 / (n * 2)}%`;
  const fillPct = currentIdx <= 0 ? 0 : currentIdx >= n - 1 ? 100 : (currentIdx / (n - 1)) * 100;

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
        {phases.map((step, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          return (
            <li key={step.key} className="flex flex-col items-center gap-2 text-center">
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
                {step.label}
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
