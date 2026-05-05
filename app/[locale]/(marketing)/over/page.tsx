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

  const t = await getTranslations("about");
  const tRaw = await getTranslations();
  const principles = tRaw.raw("about.principles") as Array<{
    kicker: string;
    title: string;
    body: string;
  }>;
  const timeline = tRaw.raw("about.timeline") as Array<{ year: string; body: string }>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("intro")}
      />

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl">{t("principlesTitle")}</h2>
          </RevealOnScroll>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {principles.map((p, i) => (
              <RevealOnScroll key={i} delay={i * 0.06} className="space-y-3">
                <p className="font-mono text-xs tracking-widest text-(--color-accent)">
                  {p.kicker}
                </p>
                <h3 className="text-xl">{p.title}</h3>
                <p className="text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl">{t("timelineTitle")}</h2>
          </RevealOnScroll>
          <ol className="mt-12 space-y-8 border-l border-(--color-border) pl-8">
            {timeline.map((item, i) => (
              <RevealOnScroll key={i} delay={i * 0.05}>
                <li className="relative">
                  <span className="absolute top-1.5 -left-[37px] h-3 w-3 rounded-full bg-(--color-accent)" />
                  <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                    {item.year}
                  </p>
                  <p className="mt-2 leading-relaxed">{item.body}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-3xl md:text-5xl">{t("ctaTitle")}</h2>
          <p className="text-(--color-muted)">{t("ctaBody")}</p>
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
