import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { MarkupText } from "@/components/animate/MarkupText";

/**
 * "Problemen die we oplossen" — keyword-rijke tekstsectie op de
 * homepage tussen Services en Founder. Bestaat omdat de homepage
 * visueel sterk is maar arm aan scanbare tekst voor Google: hier
 * staan de zoekwoorden ("dubbele boekingen", "verhuursoftware",
 * "klantportaal", "admin op maat", NL+ES) in natuurlijke zinnen.
 *
 * Drie blokken: het probleem (kort, herkenbaar), voor wie, en wat
 * eraan gedaan wordt — elk met een interne link naar de relevante
 * dienst-pagina.
 */
export async function HomeProblems() {
  const t = await getTranslations("home.problems");
  const tRaw = await getTranslations();
  const items = tRaw.raw("home.problems.items") as Array<{
    title: string;
    body: string;
    forWho: string;
    linkLabel: string;
    href: string;
  }>;

  return (
    <section className="border-t border-(--color-border) px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mb-12 max-w-2xl space-y-3">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="text-3xl md:text-5xl">
            <MarkupText>{t("title")}</MarkupText>
          </h2>
          <p className="text-[17px] leading-[1.65] text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <RevealOnScroll key={item.title} delay={i * 0.06}>
              <article className="flex h-full flex-col rounded-[18px] border border-(--color-border) bg-(--color-surface) p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                <h3 className="text-xl leading-tight font-medium">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{item.body}</p>
                <p className="mt-4 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                  {item.forWho}
                </p>
                <a
                  href={item.href}
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase transition-colors hover:text-(--color-wine)"
                >
                  {item.linkLabel} →
                </a>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
