import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { MarkupText } from "@/components/animate/MarkupText";
import { Eyebrow } from "@/components/animate/Eyebrow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceLd, breadcrumbLd, faqPageLd, siteUrl } from "@/lib/seo";
import {
  VERTICAL_SLUGS,
  isVerticalSlug,
  VERTICAL_DEMO_URLS,
  PANEL_MONTHLY_PRICE,
  type VerticalSlug,
} from "@/lib/verticals";
import { ExternalLink } from "lucide-react";

const SITE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

type VerticalContent = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  metrics: Array<{ value: string; label: string }>;
  problemEyebrow: string;
  problemTitle: string;
  problems: Array<{ title: string; body: string }>;
  solutionEyebrow: string;
  solutionTitle: string;
  solutionLede: string;
  solutions: Array<{ title: string; body: string }>;
  forWhoEyebrow: string;
  forWhoTitle: string;
  forWho: string[];
  notFor: string[];
  priceEyebrow: string;
  priceTitle: string;
  priceBody: string;
  pricePoints: string[];
  faqEyebrow: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  related: Array<{ label: string; href: string }>;
};

function getVerticalContent(
  tRaw: Awaited<ReturnType<typeof getTranslations>>,
  slug: VerticalSlug,
): VerticalContent | null {
  try {
    return tRaw.raw(`verticals.${slug}`) as VerticalContent;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  // De slug is locale-onafhankelijk; Next combineert deze met de
  // params van het bovenliggende [locale]-segment.
  return VERTICAL_SLUGS.map((vertical) => ({ vertical }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; vertical: string }>;
}): Promise<Metadata> {
  const { locale, vertical } = await params;
  if (!hasLocale(routing.locales, locale) || !isVerticalSlug(vertical)) return {};
  const tRaw = await getTranslations({ locale });
  const c = getVerticalContent(tRaw, vertical);
  if (!c) return {};

  const base = locale === "es" ? "/servicios" : "/diensten";
  const path = locale === "es" ? `/es${base}/${vertical}` : `${base}/${vertical}`;
  const url = `${SITE_URL}${path}`;
  const ogImage = `${SITE_URL}/og?title=${encodeURIComponent(c.metaTitle)}&eyebrow=${encodeURIComponent(c.eyebrow)}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: url,
      languages: {
        nl: `${SITE_URL}/diensten/${vertical}`,
        es: `${SITE_URL}/es/servicios/${vertical}`,
        "x-default": `${SITE_URL}/diensten/${vertical}`,
      },
    },
    openGraph: {
      title: `${c.metaTitle} · Webstability`,
      description: c.metaDescription,
      type: "website",
      url,
      locale: locale === "es" ? "es_ES" : "nl_NL",
      images: [{ url: ogImage, width: 1200, height: 630, alt: c.metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.metaTitle} · Webstability`,
      description: c.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ locale: string; vertical: string }>;
}) {
  const { locale, vertical } = await params;
  if (!hasLocale(routing.locales, locale) || !isVerticalSlug(vertical)) notFound();
  setRequestLocale(locale);

  const tRaw = await getTranslations();
  const c = getVerticalContent(tRaw, vertical);
  if (!c) notFound();

  const monthlyPrice = PANEL_MONTHLY_PRICE[vertical];
  const dienstenPath = locale === "es" ? "/es/servicios" : "/diensten";
  const detailPath = locale === "es" ? `/es/servicios/${vertical}` : `/diensten/${vertical}`;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <JsonLd
        data={serviceLd({
          name: c.metaTitle,
          description: c.metaDescription,
          locale,
          url: siteUrl(detailPath),
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: siteUrl(locale === "es" ? "/es" : "/"),
          },
          { name: locale === "es" ? "Servicios" : "Diensten", url: siteUrl(dienstenPath) },
          { name: c.metaTitle, url: siteUrl(detailPath) },
        ])}
      />
      <JsonLd data={faqPageLd(c.faq, locale)} />

      {/* HERO */}
      <header className="relative overflow-hidden px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl md:block"
        />
        <div className="relative mx-auto max-w-5xl">
          <Link
            href={{ pathname: "/diensten" }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            ← {locale === "es" ? "Servicios" : "Diensten"}
          </Link>
          <RevealOnScroll className="mt-6 space-y-5">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <AnimatedHeading
              as="h1"
              className="max-w-[20ch] text-[clamp(36px,5.5vw,64px)] leading-[1.05]"
            >
              {c.title}
            </AnimatedHeading>
            <p className="max-w-[60ch] text-[18px] leading-[1.65] text-(--color-muted)">{c.lede}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <CalPopupTrigger
                locale={locale}
                className={buttonVariants({ variant: "accent", size: "lg" })}
              >
                {c.ctaButton}
              </CalPopupTrigger>
              {VERTICAL_DEMO_URLS[vertical] ? (
                <a
                  href={VERTICAL_DEMO_URLS[vertical]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-(--color-wine) bg-(--color-wine)/8 px-5 py-2.5 text-[14px] font-medium text-(--color-wine) transition-colors hover:bg-(--color-wine)/15"
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-(--color-wine)"
                  />
                  {locale === "es" ? "Abrir demo en vivo" : "Open live demo"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </RevealOnScroll>

          {/* Metric-trio */}
          <div className="mt-14 grid gap-6 border-t border-(--color-border) pt-10 sm:grid-cols-3">
            {c.metrics.map((m, i) => (
              <RevealOnScroll key={m.label} delay={i * 0.06}>
                <div>
                  <p className="font-serif text-[40px] leading-none text-(--color-wine) md:text-[48px]">
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
      </header>

      {/* PROBLEEM */}
      <section className="py-section md:py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <Eyebrow>{c.problemEyebrow}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">
              <MarkupText>{c.problemTitle}</MarkupText>
            </h2>
          </RevealOnScroll>
          <div className="grid gap-5 md:grid-cols-3">
            {c.problems.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 0.06}>
                <article className="hover:shadow-card rounded-panel h-full border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-1">
                  <h3 className="text-lg leading-tight font-medium">{p.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{p.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* OPLOSSING */}
      <section className="py-section md:py-section border-t border-(--color-border) px-6">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <Eyebrow>{c.solutionEyebrow}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">
              <MarkupText>{c.solutionTitle}</MarkupText>
            </h2>
            <p className="text-(--color-muted)">{c.solutionLede}</p>
          </RevealOnScroll>
          <div className="grid gap-5 md:grid-cols-2">
            {c.solutions.map((s, i) => (
              <RevealOnScroll key={s.title} delay={i * 0.06}>
                <article className="hover:shadow-card rounded-panel h-full border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-1">
                  <h3 className="text-lg leading-tight font-medium">{s.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{s.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* VOOR WIE / NIET VOOR */}
      <section className="py-section md:py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <Eyebrow>{c.forWhoEyebrow}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">{c.forWhoTitle}</h2>
          </RevealOnScroll>
          <div className="grid gap-6 md:grid-cols-2">
            <RevealOnScroll>
              <div className="rounded-panel border border-(--color-success)/30 bg-(--color-success)/5 p-6">
                <p className="font-mono text-[10px] tracking-widest text-(--color-success) uppercase">
                  {locale === "es" ? "Encaja si" : "Past als"}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {c.forWho.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[14px] leading-[1.55] text-(--color-text)"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)"
                        strokeWidth={2.4}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.06}>
              <div className="rounded-panel border border-(--color-border) bg-(--color-surface) p-6">
                <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  {locale === "es" ? "No encaja si" : "Niet als"}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {c.notFor.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[14px] leading-[1.55] text-(--color-muted)"
                    >
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--color-muted)"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* WAT KOST HET */}
      <section className="py-section md:py-section border-t border-(--color-border) px-6">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll className="space-y-4">
            <Eyebrow>{c.priceEyebrow}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">{c.priceTitle}</h2>
            <p className="text-[16px] leading-[1.65] text-(--color-muted)">{c.priceBody}</p>
            <ul className="mt-4 space-y-2.5">
              {c.pricePoints.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2.5 text-[14px] leading-[1.55] text-(--color-text)"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)"
                    strokeWidth={2.4}
                  />
                  {p}
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                href={{ pathname: "/prijzen" }}
                className="inline-flex items-center gap-1 font-mono text-[12px] tracking-widest text-(--color-accent) uppercase hover:text-(--color-wine)"
              >
                {locale === "es" ? "Ver todos los precios" : "Bekijk alle prijzen"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-section md:py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll className="mb-10 space-y-3 text-center">
            <Eyebrow className="inline-block">{c.faqEyebrow}</Eyebrow>
            <h2 className="text-3xl leading-tight md:text-5xl">{c.faqTitle}</h2>
          </RevealOnScroll>
          <Accordion type="single" collapsible>
            {c.faq.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* INTERNE LINKS — gerelateerde pagina's */}
      {c.related.length > 0 ? (
        <section className="border-t border-(--color-border) px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {locale === "es" ? "También relevante" : "Ook relevant"}
            </p>
            <ul className="flex flex-wrap gap-3">
              {c.related.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                  >
                    {r.label}
                    <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* CTA — alle panelen krijgen dezelfde volle Cal-CTA met
          maandprijs-vermelding. Aanbod is uniform op abonnement. */}
      <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-h2">{c.ctaTitle}</h2>
          <p className="text-(--color-muted)">{c.ctaBody}</p>
          <p className="font-mono text-[12px] tracking-widest text-(--color-accent) uppercase">
            {locale === "es"
              ? `Suscripción · desde €${monthlyPrice}/mes`
              : `Abonnement · vanaf €${monthlyPrice}/mnd`}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <CalPopupTrigger
              locale={locale}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              {c.ctaButton}
            </CalPopupTrigger>
            <Button asChild size="lg" variant="ghost">
              <Link href={{ pathname: "/cases" }}>
                {locale === "es" ? "Mira el trabajo" : "Bekijk het werk"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
