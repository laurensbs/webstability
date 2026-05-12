import { Eyebrow } from "@/components/animate/Eyebrow";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

type Step = {
  week: string;
  title: string;
  body: string;
};

/**
 * Vier-weken-rib boven de productlijnen op /diensten en /cases. Mobiel:
 * gestapelde rijen met een verticale connector-lijn links langs de dots.
 * Desktop: vier kolommen met een horizontale lijn die exact van de eerste
 * dot naar de laatste dot loopt — geen losse strepen die door de layout
 * heen snijden.
 *
 * Studio-rust: één accent (terracotta) op de dunne lijn + de dot-rand,
 * cream-warm bg, geen iconen.
 */
export function BuildTimeline({
  strings,
}: {
  strings: { eyebrow: string; title: string; lede: string; steps: Step[] };
}) {
  const steps = strings.steps;
  const n = Math.max(1, steps.length);
  // Horizontale lijn op desktop loopt van het midden van de eerste kolom tot
  // het midden van de laatste — inset = halve kolombreedte aan elke kant.
  const inset = `${100 / (n * 2)}%`;

  return (
    <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mb-12 max-w-2xl space-y-3">
          <Eyebrow>{strings.eyebrow}</Eyebrow>
          <h2 className="text-h2">{strings.title}</h2>
          <p className="text-(--color-muted)">{strings.lede}</p>
        </RevealOnScroll>

        {/* Mobiel: gestapelde rijen, verticale lijn links langs de dots. */}
        <div className="relative md:hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 bottom-2 left-[5px] w-px bg-(--color-accent)/25"
          />
          <ol className="space-y-7">
            {steps.map((step, i) => (
              <RevealOnScroll key={step.week} delay={i * 0.06} className="relative pl-7">
                <span
                  aria-hidden
                  className="absolute top-1 left-0 h-[11px] w-[11px] rounded-full border-2 border-(--color-accent) bg-(--color-bg-warm)"
                />
                <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                  {step.week}
                </p>
                <h3 className="mt-1.5 text-lg font-medium text-(--color-text)">{step.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-(--color-muted)">
                  {step.body}
                </p>
              </RevealOnScroll>
            ))}
          </ol>
        </div>

        {/* Desktop: kolommen, horizontale lijn dot→dot. */}
        <div className="relative hidden md:block">
          <span
            aria-hidden
            className="pointer-events-none absolute top-[5px] h-px bg-(--color-accent)/30"
            style={{ left: inset, right: inset }}
          />
          <ol
            className="grid gap-x-6"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          >
            {steps.map((step, i) => (
              <RevealOnScroll
                key={step.week}
                delay={i * 0.06}
                className="relative flex flex-col items-center pt-7 text-center"
              >
                <span
                  aria-hidden
                  className="absolute top-0 left-1/2 h-[11px] w-[11px] -translate-x-1/2 rounded-full border-2 border-(--color-accent) bg-(--color-bg-warm)"
                />
                <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                  {step.week}
                </p>
                <h3 className="mt-2 text-lg font-medium text-(--color-text)">{step.title}</h3>
                <p className="mt-2 max-w-[26ch] text-[14px] leading-[1.55] text-(--color-muted)">
                  {step.body}
                </p>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
