import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";

import type { Metadata } from "next";
import { pageMetadata, personLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

// Kleur-codes per milestone-type op de tijdlijn — accent (start/launch
// is het hoofdverhaal), wine (pivot — een richting-verandering), success
// (move — de verhuizing naar Spanje, een positief keerpunt).
const TIMELINE_TONE: Record<
  "start" | "pivot" | "move" | "launch",
  { border: string; dot: string; text: string }
> = {
  start: {
    border: "border-(--color-accent)",
    dot: "bg-(--color-accent)",
    text: "text-(--color-accent)",
  },
  pivot: {
    border: "border-(--color-wine)",
    dot: "bg-(--color-wine)",
    text: "text-(--color-wine)",
  },
  move: {
    border: "border-(--color-success)",
    dot: "bg-(--color-success)",
    text: "text-(--color-success)",
  },
  launch: {
    border: "border-(--color-accent)",
    dot: "bg-(--color-accent)",
    text: "text-(--color-accent)",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "over");
}

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
  const timeline = tRaw.raw("about.timeline") as Array<{
    year: string;
    body: string;
    type?: "start" | "pivot" | "move" | "launch";
  }>;
  const langBadges = tRaw.raw("about.langBadges") as string[];

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <JsonLd data={personLd(locale)} />
      {/* HERO with portrait + intro side-by-side */}
      <section className="relative overflow-hidden px-6 pt-16 pb-16 md:pt-28 md:pb-32">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.4fr] md:items-center md:gap-12">
          <RevealOnScroll>
            {/* Portrait — echte foto via remote pattern (cubeupload). Past
                bij de homepage Founder-block die dezelfde URL toont. */}
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-[28px] shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)] md:mx-0 md:max-w-sm">
              <Image
                src="https://u.cubeupload.com/laurensbos/fc7278a70fe64fb6aa6a.jpg"
                alt={t("title")}
                fill
                sizes="(min-width: 768px) 384px, 220px"
                className="object-cover"
                priority
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-bg)/85 px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-muted) backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
                </span>
                <MapPin className="h-3 w-3" />
                Costa Brava · Spanje
              </span>
              {/* Persoonlijk merkje — spiegelt de locatie-badge linksboven */}
              <span className="absolute right-3 bottom-3 inline-flex items-center rounded-full border border-(--color-border) bg-(--color-bg)/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-(--color-text) backdrop-blur-sm">
                LB
              </span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="space-y-5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <AnimatedHeading as="h1" className="text-4xl leading-[1.05] md:text-6xl">
              {t("title")}
            </AnimatedHeading>
            <p className="text-lg leading-relaxed text-(--color-muted) md:text-xl">{t("intro")}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {langBadges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-(--color-muted) uppercase"
                >
                  {b}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="py-section relative overflow-hidden border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-40 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-2xl space-y-3">
            <Eyebrow>principes</Eyebrow>
            <AnimatedHeading as="h2" className="text-h2">
              {t("principlesTitle")}
            </AnimatedHeading>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {principles.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 0.06}>
                <article className="group h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                  <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {p.kicker}
                  </p>
                  <h3 className="mt-3 text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll className="mt-10 max-w-2xl">
            <p className="font-serif text-xl leading-snug text-(--color-text) md:text-2xl">
              {t("principlesToProof")}
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* NOW BUILDING — verhuur-credentials zichtbaar maken. Strategie:
          MKB-prospects + verhuur-prospects landen allebei op /over;
          deze drie regels laten ze zien wat de huidige realiteit is. */}
      <section className="py-section border-t-2 border-(--color-wine)/40 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl space-y-3">
            <Eyebrow>{t("nowBuilding.eyebrow")}</Eyebrow>
            <AnimatedHeading as="h2" className="text-h2">
              {t("nowBuilding.title")}
            </AnimatedHeading>
            <p className="max-w-[56ch] text-[17px] leading-[1.65] text-(--color-muted)">
              {t("nowBuilding.lede")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(
              tRaw.raw("about.nowBuilding.items") as Array<{
                metric: string;
                label: string;
                body: string;
              }>
            ).map((it, i) => (
              <RevealOnScroll key={it.label} delay={i * 0.06}>
                <article className="h-full rounded-[18px] border border-(--color-border) bg-(--color-surface) p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                  <p className="font-serif text-[40px] leading-none text-(--color-wine)">
                    {it.metric}
                  </p>
                  <p className="mt-3 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                    {it.label}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{it.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-section px-6">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-3">
            <Eyebrow>tijdlijn</Eyebrow>
            <AnimatedHeading as="h2" className="text-h2">
              {t("timelineTitle")}
            </AnimatedHeading>
          </div>
          <ol className="relative mt-14 space-y-10 border-l-2 border-(--color-border) pl-10">
            {timeline.map((item, i) => {
              const tone = TIMELINE_TONE[item.type ?? "start"];
              return (
                <RevealOnScroll key={`${item.year}-${i}`} delay={i * 0.05}>
                  <li className="relative">
                    <span
                      className={`absolute top-2 -left-[47px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${tone.border} bg-(--color-bg)`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    </span>
                    <p className={`font-mono text-xs tracking-widest uppercase ${tone.text}`}>
                      {item.year}
                    </p>
                    <p className="mt-2 leading-relaxed">{item.body}</p>
                  </li>
                </RevealOnScroll>
              );
            })}
          </ol>
        </div>
      </section>

      {/* FIRST-CLIENT QUOTE — ingetogen, niet als testimonial-card.
          Tone: over de transformatie bij de klant, niet over Laurens.
          Clickable → het volledige verhaal in de case-detail. */}
      <section className="px-6 pb-24">
        <RevealOnScroll className="mx-auto max-w-3xl">
          <Link
            href="/cases/caravanverhuurspanje"
            className="group block border-l-2 border-(--color-accent) pl-6 transition-colors hover:border-(--color-wine)"
          >
            <blockquote className="font-serif text-2xl leading-[1.5] text-(--color-text) md:text-[28px] md:leading-[1.5]">
              {t("firstClientQuote.quote")}
            </blockquote>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {t("firstClientQuote.attribution")}
              <span className="inline-flex items-center gap-1 text-(--color-accent) transition-colors group-hover:text-(--color-wine)">
                {t("firstClientQuote.caseLabel")}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </p>
          </Link>
        </RevealOnScroll>
      </section>

      {/* CTA */}
      <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-h2">{t("ctaTitle")}</h2>
          <p className="text-(--color-muted)">{t("ctaBody")}</p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <CalPopupTrigger
              locale={locale}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              {t("ctaButton")}
            </CalPopupTrigger>
            <Link
              href="/cases"
              className={`${buttonVariants({ variant: "ghost", size: "lg" })} gap-1`}
            >
              {t("ctaSecondary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
