import { Eyebrow } from "@/components/animate/Eyebrow";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";

type Scenario = { title: string; body: string };

/**
 * "Wanneer ben je beter af elders?"-sectie onderaan /diensten.
 * Bewust rustig: cream-warm bg, geen accent op de body, alleen op de
 * eyebrow. Eerlijk filterwerk in plaats van een sales-funnel — drie
 * scenario's waar een andere route slimmer is.
 *
 * Strategie: filter slechte calls eruit op de pagina, niet pas in een
 * Cal-flow. Eerlijk = vertrouwenwekkend.
 */
export function NotForSection({
  strings,
}: {
  strings: { eyebrow: string; title: string; lede: string; scenarios: Scenario[] };
}) {
  return (
    <section className="border-t border-(--color-border) px-6 py-20 md:py-24">
      <div className="mx-auto max-w-5xl">
        <RevealOnScroll className="mb-12 max-w-2xl space-y-3">
          <Eyebrow>{strings.eyebrow}</Eyebrow>
          <h2 className="text-3xl leading-tight md:text-4xl">
            <MarkupText>{strings.title}</MarkupText>
          </h2>
          <p className="text-(--color-muted)">{strings.lede}</p>
        </RevealOnScroll>

        <ul className="grid gap-4 md:grid-cols-3">
          {strings.scenarios.map((s, i) => (
            <RevealOnScroll key={s.title} delay={i * 0.05}>
              <article className="h-full rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6">
                <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  scenario {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-medium text-(--color-text)">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{s.body}</p>
              </article>
            </RevealOnScroll>
          ))}
        </ul>
      </div>
    </section>
  );
}
