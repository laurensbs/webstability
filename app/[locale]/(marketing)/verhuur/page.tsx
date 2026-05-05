import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("verhuur");
  const tRaw = await getTranslations();
  const problems = tRaw.raw("verhuur.problems") as Array<{ title: string; body: string }>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl">{t("problemTitle")}</h2>
          </RevealOnScroll>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {problems.map((p, i) => (
              <RevealOnScroll key={i} delay={i * 0.06}>
                <article className="h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
                  <h3 className="text-lg">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl md:text-4xl">{t("solutionTitle")}</h2>
          <p className="text-lg leading-relaxed text-(--color-muted)">{t("solutionBody")}</p>
        </RevealOnScroll>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
            {t("priceTitle")}
          </p>
          <p className="text-lg leading-relaxed text-(--color-muted)">{t("priceBody")}</p>
          <div className="pt-2">
            <Button asChild size="lg" variant="accent">
              <Link href="/contact">{t("ctaButton")}</Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
