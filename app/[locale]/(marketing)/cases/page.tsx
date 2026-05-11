import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CaseScreenshot } from "@/components/marketing/CaseScreenshot";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { BuildTimeline } from "@/components/marketing/diensten/BuildTimeline";
import { NotForSection } from "@/components/marketing/diensten/NotForSection";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "cases");
}

type ProductLineItem = {
  anchor: string;
  name: string;
  url: string;
  logoUrl?: string;
  /** Optionele Vimeo share-URL — als aanwezig vervangt de video de
   * statische microlink-screenshot in CaseScreenshot. */
  videoUrl?: string;
  /** Optioneel: interne detail-page (bv. `/cases/caravanverhuurspanje`).
   * Als gezet wordt de hoofd-CTA een interne Link i.p.v. externe
   * "bekijk live"-link, en gaat de externe URL naar een tweede pill. */
  detailHref?: string;
  tagline: string;
  what: string;
  for: string;
  stack: string;
  cta: string;
  /** Optionele label voor secundaire CTA (live-site link) wanneer
   * detailHref aanwezig is. */
  ctaSecondary?: string;
  stats?: string[];
};

type ClientCase = {
  anchor: string;
  name: string;
  url: string;
  detailHref?: string;
  logoUrl?: string;
  tagline: string;
  what: string;
  result: string;
  cta: string;
  stats?: string[];
};

type ProductionItem = {
  name: string;
  url: string;
  logoUrl?: string;
  kind: string;
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("casesPage");
  const tNav = await getTranslations("nav");
  const tRaw = await getTranslations();
  const productLines = tRaw.raw("casesPage.productLines.items") as ProductLineItem[];
  const clientCases = tRaw.raw("casesPage.clientCases.items") as ClientCase[];
  const production = tRaw.raw("casesPage.production.items") as ProductionItem[];

  // Visuele hiërarchie: hoofdcase (eerste item, met detailHref) als breed
  // feature-card bovenaan, andere productlijnen daaronder in 2-koloms.
  const featureLine = productLines.find((p) => p.detailHref) ?? productLines[0];
  const otherLines = productLines.filter((p) => p !== featureLine);

  // BuildTimeline + NotForSection strings hergebruiken van /diensten —
  // zelfde 4-weken-rib en eerlijke afbakening werken hier ook.
  const timelineStrings = tRaw.raw("servicesPage.timeline") as {
    eyebrow: string;
    title: string;
    lede: string;
    steps: Array<{ week: string; title: string; body: string }>;
  };
  const notForStrings = tRaw.raw("servicesPage.notFor") as {
    eyebrow: string;
    title: string;
    lede: string;
    scenarios: Array<{ title: string; body: string }>;
  };

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      {/* SECTIE A — Productlijnen */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="mb-10 max-w-3xl space-y-3">
            <Eyebrow>{t("productLines.eyebrow")}</Eyebrow>
            <h2 className="text-3xl md:text-5xl">{t("productLines.title")}</h2>
            <p className="text-(--color-muted)">{t("productLines.lede")}</p>
          </RevealOnScroll>

          {/* Feature-card (volle breedte) — hoofdcase met meer ademruimte
              en interne detail-link. Past bij de "één hoofdcase, één
              detail-page"-strategie. */}
          {featureLine ? (
            <RevealOnScroll className="group mb-6 flex flex-col overflow-hidden rounded-[24px] border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) transition-all duration-300 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12)] md:grid md:grid-cols-[1.2fr_1fr] md:gap-0">
              <article
                id={featureLine.anchor}
                className="flex scroll-mt-24 flex-col p-8 md:order-2 md:p-10"
              >
                <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                  {featureLine.tagline}
                </p>
                <h3 className="mt-3 text-3xl md:text-4xl">{featureLine.name}</h3>
                <p className="mt-4 text-[16px] leading-[1.65] text-(--color-muted)">
                  {featureLine.what}
                </p>
                {featureLine.stats && featureLine.stats.length > 0 ? (
                  <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-wider text-(--color-muted) uppercase">
                    {featureLine.stats.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        {idx > 0 ? (
                          <span aria-hidden className="text-(--color-border)">
                            ·
                          </span>
                        ) : null}
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 space-y-3 border-t border-(--color-border) pt-5 text-[14px] leading-[1.6]">
                  <p className="text-(--color-muted)">
                    <span className="font-mono text-[10px] tracking-widest text-(--color-text) uppercase">
                      Voor:
                    </span>{" "}
                    {featureLine.for}
                  </p>
                  <p className="font-mono text-[12px] tracking-wide text-(--color-muted)">
                    {featureLine.stack}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
                  {featureLine.detailHref ? (
                    <Link
                      href={{ pathname: featureLine.detailHref as never }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-(--color-accent)/90"
                    >
                      {featureLine.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                  <a
                    href={featureLine.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-(--color-accent) hover:underline"
                  >
                    {featureLine.ctaSecondary ?? featureLine.url.replace(/^https?:\/\//, "")}{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
              <div className="relative md:order-1">
                <CaseScreenshot
                  url={featureLine.url}
                  alt={`${featureLine.name} screenshot`}
                  videoUrl={featureLine.videoUrl}
                  ratio="4/3"
                  className="rounded-none border-0 md:h-full"
                />
                {featureLine.logoUrl ? (
                  <div className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/95 p-1.5 shadow-[0_4px_12px_rgba(31,27,22,0.12)] backdrop-blur">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featureLine.logoUrl}
                      alt={`${featureLine.name} logo`}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : null}
              </div>
            </RevealOnScroll>
          ) : null}

          {/* Andere productlijnen — 2-koloms grid eronder */}
          <div className="grid gap-6 md:grid-cols-2">
            {otherLines.map((item, i) => (
              <RevealOnScroll
                key={item.anchor}
                delay={i * 0.06}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-(--color-border) bg-(--color-surface) transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12)]"
              >
                <article id={item.anchor} className="flex h-full scroll-mt-24 flex-col">
                  <div className="relative">
                    <CaseScreenshot
                      url={item.url}
                      alt={`${item.name} screenshot`}
                      videoUrl={item.videoUrl}
                    />
                    {item.logoUrl ? (
                      <div className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/95 p-1.5 shadow-[0_4px_12px_rgba(31,27,22,0.12)] backdrop-blur">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.logoUrl}
                          alt={`${item.name} logo`}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex h-full flex-col p-8">
                    <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                      {item.tagline}
                    </p>
                    <h3 className="mt-3 text-2xl md:text-3xl">{item.name}</h3>
                    <p className="mt-4 text-[15px] leading-[1.65] text-(--color-muted)">
                      {item.what}
                    </p>
                    {item.stats && item.stats.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-wider text-(--color-muted) uppercase">
                        {item.stats.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            {idx > 0 ? (
                              <span aria-hidden className="text-(--color-border)">
                                ·
                              </span>
                            ) : null}
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-5 space-y-3 border-t border-(--color-border) pt-5 text-[14px] leading-[1.6]">
                      <p className="text-(--color-muted)">
                        <span className="font-mono text-[10px] tracking-widest text-(--color-text) uppercase">
                          Voor:
                        </span>{" "}
                        {item.for}
                      </p>
                      <p className="font-mono text-[12px] tracking-wide text-(--color-muted)">
                        {item.stack}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-[14px] font-medium">
                      {item.detailHref ? (
                        <Link
                          href={{ pathname: item.detailHref as never }}
                          className="inline-flex items-center gap-1.5 text-(--color-accent) hover:underline"
                        >
                          {t("productLines.viewCaseLabel")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-(--color-accent) hover:underline"
                      >
                        {item.cta} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          {/* Inline CTA voor productlijnen — "wil je dit ook?" */}
          <RevealOnScroll className="mt-10 rounded-[24px] border border-(--color-text) bg-(--color-text) p-8 text-(--color-bg) md:p-10">
            <div className="flex flex-col gap-4 md:grid md:grid-cols-[1.4fr_auto] md:items-center md:gap-6">
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl">{t("productLines.ctaTitle")}</h3>
                <p className="text-[15px] leading-[1.6] text-(--color-bg)/75">
                  {t("productLines.ctaBody")}
                </p>
              </div>
              <div className="flex md:justify-end">
                <CalPopupTrigger locale={locale} className={buttonVariants({ variant: "accent" })}>
                  {t("productLines.ctaButton")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </CalPopupTrigger>
              </div>
            </div>
          </RevealOnScroll>

          {/* Demo-callout — wijn-rood, links naar /demo/portal */}
          <RevealOnScroll className="mt-6 rounded-[20px] border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-7">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
              <div>
                <p className="text-[11px] font-medium tracking-[0.08em] text-(--color-wine)">
                  {t("demoCallout.eyebrow")}
                </p>
                <h3 className="mt-2 font-serif text-xl md:text-2xl">{t("demoCallout.title")}</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-(--color-muted)">
                  {t("demoCallout.body")}
                </p>
              </div>
              <Link
                href="/demo/portal"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--color-wine) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
              >
                {t("demoCallout.cta")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTIE B — Klantcases */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="mb-10 max-w-3xl space-y-3">
            <Eyebrow>{t("clientCases.eyebrow")}</Eyebrow>
            <h2 className="text-3xl md:text-5xl">{t("clientCases.title")}</h2>
            <p className="text-(--color-muted)">{t("clientCases.lede")}</p>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-2">
            {clientCases.map((item, i) => (
              <RevealOnScroll
                key={item.anchor}
                delay={i * 0.06}
                className="overflow-hidden rounded-[24px] border border-(--color-border) bg-(--color-surface)"
              >
                <article id={item.anchor} className="flex h-full scroll-mt-24 flex-col">
                  <div className="relative">
                    <CaseScreenshot url={item.url} alt={`${item.name} screenshot`} />
                    {item.logoUrl ? (
                      <div className="absolute top-3 left-3 flex h-11 items-center rounded-[10px] bg-white/95 px-2.5 py-1.5 shadow-[0_4px_12px_rgba(31,27,22,0.12)] backdrop-blur">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.logoUrl}
                          alt={`${item.name} logo`}
                          loading="lazy"
                          className="max-h-7 w-auto object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex h-full flex-col p-8">
                    <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                      {item.tagline}
                    </p>
                    <h3 className="mt-3 text-2xl md:text-3xl">{item.name}</h3>
                    <p className="mt-4 text-[15px] leading-[1.65] text-(--color-muted)">
                      {item.what}
                    </p>
                    {item.stats && item.stats.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-wider text-(--color-muted) uppercase">
                        {item.stats.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            {idx > 0 ? (
                              <span aria-hidden className="text-(--color-border)">
                                ·
                              </span>
                            ) : null}
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-4 border-l-2 border-(--color-accent) pl-4 font-serif text-[17px] italic">
                      {item.result}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-[14px] font-medium">
                      {item.detailHref ? (
                        <Link
                          href={{ pathname: item.detailHref as never }}
                          className="inline-flex items-center gap-1.5 text-(--color-accent) hover:underline"
                        >
                          {t("productLines.viewCaseLabel")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-(--color-accent) hover:underline"
                      >
                        {item.cta} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* SECTIE C — Sites in productie */}
      <section className="border-t border-(--color-border) px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="mb-8 max-w-3xl space-y-3">
            <Eyebrow>{t("production.eyebrow")}</Eyebrow>
            <h2 className="text-2xl md:text-3xl">{t("production.title")}</h2>
            <p className="text-(--color-muted)">{t("production.lede")}</p>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {production.map((p, i) => (
              <RevealOnScroll key={p.url} delay={i * 0.04}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col items-center justify-center gap-3 rounded-[14px] border border-(--color-border) bg-(--color-surface) px-4 py-6 text-center transition-colors hover:border-(--color-accent)/50"
                >
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt={`${p.name} logo`}
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-md object-contain md:h-8 md:w-8"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-(--color-bg-warm) font-mono text-[14px] font-medium text-(--color-muted) md:h-8 md:w-8"
                    >
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-(--color-text)">{p.name}</p>
                    <p className="text-[11px] text-(--color-muted)">{p.kind}</p>
                  </div>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 text-(--color-muted) transition-colors group-hover:text-(--color-accent)"
                    aria-hidden
                  />
                </a>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* "Zo verloopt een traject" — hergebruikt van /diensten */}
      <BuildTimeline strings={timelineStrings} />

      {/* Eerlijke afbakening — hergebruikt van /diensten */}
      <NotForSection strings={notForStrings} />

      {/* Footer-CTA */}
      <section className="border-t border-(--color-border) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-2xl md:text-4xl">{t("footerCtaTitle")}</h2>
          <p className="text-(--color-muted)">{t("footerCtaBody")}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <CalPopupTrigger locale={locale} className={buttonVariants({ variant: "primary" })}>
              {t("footerCtaLabel")}
              <ArrowRight className="h-3.5 w-3.5" />
            </CalPopupTrigger>
            {featureLine?.detailHref ? (
              <Button asChild variant="outline">
                <Link href={{ pathname: featureLine.detailHref as never }}>
                  {t("footerCtaDetailLabel")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/diensten">
                {tNav("services")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/prijzen">
                {tNav("pricing")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
