import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { AlertTriangle, Calendar, CreditCard, Globe, Smartphone, Users, Zap } from "lucide-react";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

const FEATURE_ICONS = [Calendar, Users, CreditCard, Zap, Smartphone, Globe];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("verhuur");
  const tRaw = await getTranslations();
  const problems = tRaw.raw("verhuur.problems") as Array<{ title: string; body: string }>;
  const features = tRaw.raw("verhuur.features") as Array<{ title: string; body: string }>;
  const stack = [
    "Next.js",
    "TypeScript",
    "Postgres",
    "Drizzle",
    "Stripe",
    "Mollie",
    "Holded",
    "e-Boekhouden",
  ];

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      {/* PROBLEMS */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="max-w-2xl space-y-3">
            <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
              {"// "}problemen
            </p>
            <h2 className="text-3xl md:text-4xl">{t("problemTitle")}</h2>
          </RevealOnScroll>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {problems.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 0.06}>
                <article className="group flex h-full gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent)">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-lg">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6">
          <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
            {"// "}oplossing
          </p>
          <h2 className="text-3xl md:text-5xl">{t("solutionTitle")}</h2>
          <p className="text-lg leading-relaxed text-(--color-muted)">{t("solutionBody")}</p>
        </RevealOnScroll>
      </section>

      {/* FEATURES */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="max-w-2xl space-y-3">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {"// "}features
            </p>
            <h2 className="text-3xl md:text-4xl">{t("featuresTitle")}</h2>
            <p className="text-(--color-muted)">{t("featuresLede")}</p>
          </RevealOnScroll>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Zap;
              return (
                <RevealOnScroll key={f.title} delay={i * 0.05}>
                  <article className="group h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent) transition-colors duration-300 group-hover:border-(--color-accent) group-hover:bg-(--color-accent-soft)">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-5 text-lg">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{f.body}</p>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll className="space-y-4">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {"// "}stack
            </p>
            <h2 className="text-2xl md:text-3xl">{t("stackTitle")}</h2>
            <p className="text-(--color-muted)">{t("stackLede")}</p>
          </RevealOnScroll>
          <RevealOnScroll className="mt-8 flex flex-wrap gap-2">
            {stack.map((s) => (
              <span
                key={s}
                className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-xs tracking-wide text-(--color-muted)"
              >
                {s}
              </span>
            ))}
          </RevealOnScroll>
        </div>
      </section>

      {/* PRICE + CTA */}
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
