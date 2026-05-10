import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { CaseScreenshot } from "@/components/marketing/CaseScreenshot";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { BuildTimeline } from "@/components/marketing/diensten/BuildTimeline";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "caseCaravanverhuur");
}

type Metric = { value: string; label: string };
type ProblemItem = { title: string; body: string };
type Quote = { text: string; name: string; role: string };

/**
 * Detail-page voor de hoofdcase. Server-component, leest uit
 * `messages/*.json` `casesPage.detail.caravanverhuur.*`.
 *
 * Volgorde: hero (titel + lede + video) → metric-trio →
 * probleem → scope → BuildTimeline (4-weken-rib, hergebruikt
 * van /diensten) → resultaat → quote → stack → CTA → terug-link.
 */
export default async function CaravanverhuurDetailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("casesPage.detail.caravanverhuur");
  const tRaw = await getTranslations();
  const metrics = tRaw.raw("casesPage.detail.caravanverhuur.metrics") as Metric[];
  const problemItems = tRaw.raw("casesPage.detail.caravanverhuur.problem.items") as ProblemItem[];
  const scopeItems = tRaw.raw("casesPage.detail.caravanverhuur.scope.items") as string[];
  const stackItems = tRaw.raw("casesPage.detail.caravanverhuur.stack.items") as string[];
  const quote = tRaw.raw("casesPage.detail.caravanverhuur.quote") as Quote;

  // BuildTimeline strings hergebruiken van /diensten — geen
  // duplicaat-copy nodig, zelfde 4-weken-rib werkt voor /cases ook.
  const timelineStrings = tRaw.raw("servicesPage.timeline") as {
    eyebrow: string;
    title: string;
    lede: string;
    steps: Array<{ week: string; title: string; body: string }>;
  };

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      {/* HERO */}
      <header className="relative overflow-hidden px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl md:block"
        />
        <div className="relative mx-auto max-w-5xl">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            ← {t("eyebrow")}
          </Link>
          <RevealOnScroll className="mt-6">
            <h1 className="max-w-[20ch] text-[clamp(36px,5.5vw,64px)] leading-[1.05]">
              <MarkupText>{t("title")}</MarkupText>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll>
            <p className="mt-6 max-w-[60ch] text-[18px] leading-[1.65] text-(--color-muted)">
              {t("lede")}
            </p>
          </RevealOnScroll>
        </div>
      </header>

      {/* HERO-VIDEO */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll>
            <CaseScreenshot
              url="https://caravanverhuurspanje.com"
              alt="Caravanverhuurspanje — verhuurplatform"
              videoUrl={t("videoUrl")}
              ratio="16/10"
              className="shadow-[0_24px_48px_-12px_rgba(31,27,22,0.18)]"
            />
          </RevealOnScroll>

          {/* Metric-trio onder video */}
          <div className="mt-10 grid gap-6 border-t border-(--color-border) pt-10 md:grid-cols-3">
            {metrics.map((m, i) => (
              <RevealOnScroll key={m.label} delay={i * 0.06}>
                <div>
                  <p className="font-serif text-[44px] leading-none text-(--color-wine) md:text-[56px]">
                    {m.value}
                  </p>
                  <p className="mt-3 max-w-[28ch] font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    {m.label}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEEM */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <Eyebrow>{t("problem.eyebrow")}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">
              <MarkupText>{t("problem.title")}</MarkupText>
            </h2>
            <p className="text-(--color-muted)">{t("problem.lede")}</p>
          </RevealOnScroll>
          <div className="grid gap-5 md:grid-cols-3">
            {problemItems.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 0.06}>
                <article className="h-full rounded-[18px] border border-(--color-border) bg-(--color-surface) p-6">
                  <h3 className="text-lg leading-tight font-medium">{p.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{p.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* SCOPE */}
      <section className="border-t border-(--color-border) px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <Eyebrow>{t("scope.eyebrow")}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">
              <MarkupText>{t("scope.title")}</MarkupText>
            </h2>
            <p className="text-(--color-muted)">{t("scope.lede")}</p>
          </RevealOnScroll>
          <ul className="grid gap-3 rounded-[18px] border border-(--color-border) bg-(--color-surface) p-6 md:grid-cols-2 md:p-8">
            {scopeItems.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2.5 text-[15px] leading-[1.55] text-(--color-text)"
              >
                <span
                  aria-hidden
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--color-accent)"
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4-WEKEN-RIB — hergebruikt van /diensten */}
      <BuildTimeline strings={timelineStrings} />

      {/* RESULTAAT */}
      <section className="border-t border-(--color-border) px-6 py-20 md:py-24">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Eyebrow className="text-center">{t("result.eyebrow")}</Eyebrow>
          <h2 className="text-3xl leading-tight md:text-5xl">
            <MarkupText>{t("result.title")}</MarkupText>
          </h2>
          <p className="text-(--color-muted)">{t("result.lede")}</p>
        </div>
      </section>

      {/* QUOTE */}
      <section className="bg-(--color-text) px-6 py-20 text-(--color-bg) md:py-24">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <blockquote className="font-serif text-[clamp(24px,3vw,32px)] leading-[1.3] font-light">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p className="mt-8 font-medium">{quote.name}</p>
          <p className="font-mono text-[11px] tracking-widest text-(--color-bg)/60 uppercase">
            {quote.role}
          </p>
        </RevealOnScroll>
      </section>

      {/* STACK */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {t("stack.eyebrow")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {stackItems.map((s) => (
              <li
                key={s}
                className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-[12px] text-(--color-text)"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-(--color-border) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-2xl leading-tight md:text-4xl">{t("cta.title")}</h2>
          <p className="text-(--color-muted)">{t("cta.body")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <CalPopupTrigger
              locale={locale}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {t("cta.primary")}
              <ArrowRight className="h-3.5 w-3.5" />
            </CalPopupTrigger>
            <Button asChild variant="outline" size="lg">
              <Link href="/verhuur">
                {t("cta.secondary")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <a
              href="https://caravanverhuurspanje.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-(--color-accent) hover:underline"
            >
              caravanverhuurspanje.com <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </RevealOnScroll>
      </section>

      {/* TERUG */}
      <section className="border-t border-(--color-border) px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            {t("back")}
          </Link>
        </div>
      </section>
    </main>
  );
}
