import { Eyebrow } from "@/components/animate/Eyebrow";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

type Step = {
  week: string;
  title: string;
  body: string;
};

/**
 * Vier-weken-rib boven de productlijnen op /diensten. Horizontaal op
 * desktop (4 kolommen), gestapeld op mobile. Geen iconen, geen halos
 * — gewoon week-label in font-mono, korte titel, één zin uitleg.
 *
 * Past bij de studio-rust-keuze: één accent (terracotta, alleen op de
 * dunne week-divider), cream-warm bg, subtiele dunne lijn die de vier
 * stappen visueel verbindt.
 */
export function BuildTimeline({
  strings,
}: {
  strings: { eyebrow: string; title: string; lede: string; steps: Step[] };
}) {
  return (
    <section className="py-section md:py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mb-12 max-w-2xl space-y-3">
          <Eyebrow>{strings.eyebrow}</Eyebrow>
          <h2 className="text-3xl leading-tight md:text-4xl">{strings.title}</h2>
          <p className="text-(--color-muted)">{strings.lede}</p>
        </RevealOnScroll>

        <div className="relative grid gap-6 md:grid-cols-4 md:gap-0">
          {/* Horizontale connector-lijn op desktop. Begint na de eerste
              week-marker, eindigt voor de laatste — visueel verbonden,
              niet aan de randen plakkend. */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 left-[12.5%] hidden h-px w-3/4 bg-(--color-accent)/30 md:block"
          />

          {strings.steps.map((step, i) => (
            <RevealOnScroll
              key={step.week}
              delay={i * 0.06}
              className="relative md:px-5 md:first:pl-0 md:last:pr-0"
            >
              {/* Marker-dot bovenaan, aligned met de connector-lijn */}
              <span
                aria-hidden
                className="absolute top-1 left-0 hidden h-3 w-3 rounded-full border-2 border-(--color-accent) bg-(--color-bg) md:block"
              />
              <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase md:pt-0 md:pl-6">
                {step.week}
              </p>
              <h3 className="mt-2 text-lg font-medium text-(--color-text) md:pl-6">{step.title}</h3>
              <p className="mt-2 max-w-[28ch] text-[14px] leading-[1.55] text-(--color-muted) md:pl-6">
                {step.body}
              </p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
