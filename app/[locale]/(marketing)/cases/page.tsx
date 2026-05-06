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
import { Button } from "@/components/ui/Button";
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
  tagline: string;
  what: string;
  for: string;
  stack: string;
  cta: string;
};

type ClientCase = {
  anchor: string;
  name: string;
  url: string;
  logoUrl?: string;
  tagline: string;
  what: string;
  result: string;
  cta: string;
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
  const tRaw = await getTranslations();
  const productLines = tRaw.raw("casesPage.productLines.items") as ProductLineItem[];
  const clientCases = tRaw.raw("casesPage.clientCases.items") as ClientCase[];
  const production = tRaw.raw("casesPage.production.items") as ProductionItem[];

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

          <div className="grid gap-6 md:grid-cols-2">
            {productLines.map((item, i) => (
              <RevealOnScroll
                key={item.anchor}
                delay={i * 0.06}
                className="group flex h-full flex-col rounded-[24px] border border-(--color-border) bg-(--color-surface) p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12)]"
              >
                <article id={item.anchor} className="flex h-full scroll-mt-24 flex-col">
                  {item.logoUrl ? (
                    <div className="mb-5 flex h-14 items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.logoUrl}
                        alt={`${item.name} logo`}
                        loading="lazy"
                        className="max-h-14 w-auto max-w-[200px] object-contain"
                      />
                    </div>
                  ) : null}
                  <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                    {item.tagline}
                  </p>
                  <h3 className="mt-3 text-2xl md:text-3xl">{item.name}</h3>
                  <p className="mt-4 text-[15px] leading-[1.65] text-(--color-muted)">
                    {item.what}
                  </p>
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
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium text-(--color-accent) hover:underline"
                  >
                    {item.cta} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          {/* Inline CTA voor productlijnen — "wil je dit ook?" */}
          <RevealOnScroll className="mt-10 rounded-[24px] border border-(--color-text) bg-(--color-text) p-8 text-(--color-bg) md:p-10">
            <div className="grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl">{t("productLines.ctaTitle")}</h3>
                <p className="text-[15px] leading-[1.6] text-(--color-bg)/75">
                  {t("productLines.ctaBody")}
                </p>
              </div>
              <div className="flex md:justify-end">
                <Button asChild variant="accent">
                  <Link href="/contact">
                    {t("productLines.ctaButton")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
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
                className="rounded-[24px] border border-(--color-border) bg-(--color-surface) p-8"
              >
                <article id={item.anchor} className="scroll-mt-24">
                  {item.logoUrl ? (
                    <div className="mb-5 flex h-14 items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.logoUrl}
                        alt={`${item.name} logo`}
                        loading="lazy"
                        className="max-h-14 w-auto max-w-[200px] object-contain"
                      />
                    </div>
                  ) : null}
                  <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                    {item.tagline}
                  </p>
                  <h3 className="mt-3 text-2xl md:text-3xl">{item.name}</h3>
                  <p className="mt-4 text-[15px] leading-[1.65] text-(--color-muted)">
                    {item.what}
                  </p>
                  <p className="mt-4 border-l-2 border-(--color-accent) pl-4 font-serif text-[17px] italic">
                    {item.result}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-(--color-accent) hover:underline"
                  >
                    {item.cta} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
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

          <div className="grid gap-3 md:grid-cols-3">
            {production.map((p, i) => (
              <RevealOnScroll key={p.url} delay={i * 0.04}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-[14px] border border-(--color-border) bg-(--color-surface) px-5 py-4 transition-colors hover:border-(--color-accent)/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl}
                        alt={`${p.name} logo`}
                        loading="lazy"
                        className="h-8 w-8 shrink-0 rounded-md object-contain"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-(--color-text)">
                        {p.name}
                      </p>
                      <p className="text-[12px] text-(--color-muted)">{p.kind}</p>
                    </div>
                  </div>
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-(--color-muted) transition-colors group-hover:text-(--color-accent)"
                    aria-hidden
                  />
                </a>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Footer-CTA */}
      <section className="border-t border-(--color-border) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-2xl md:text-4xl">{t("footerCtaTitle")}</h2>
          <p className="text-(--color-muted)">{t("footerCtaBody")}</p>
          <div className="flex justify-center pt-2">
            <Button asChild variant="primary">
              <Link href="/contact">
                {t("footerCtaLabel")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
