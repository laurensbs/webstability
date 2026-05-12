import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Calendar, FileText, CreditCard, X, Zap, Clock } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { RoiCalculator } from "@/components/marketing/RoiCalculator";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { AvailabilityPill } from "@/components/animate/AvailabilityPill";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { CaravanMount } from "@/components/r3f/CaravanMount";
import { FlashCounter } from "@/components/animate/FlashCounter";
import { MagneticButton } from "@/components/animate/MagneticButton";
import { QuoteMarkDraw } from "@/components/animate/QuoteMarkDraw";

import type { Metadata } from "next";
import { pageMetadata, serviceLd, siteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "verhuur");
}

type MetaItem = { num: string; label: string };
type ProblemItem = { title: string; body: string };
type SolutionItem = { title: string; body: string; bullets?: string[] };
type CompetitorItem = { name: string; dna: string; breaks: string };
type Plan = {
  id: string;
  name: string;
  desc: string;
  price: string;
  period: string;
  items: string[];
  cta: string;
};

const PROBLEM_ICONS = [X, Zap, Clock];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("verhuur.v2");
  const tRaw = await getTranslations();
  const metaItems = tRaw.raw("verhuur.v2.metaItems") as MetaItem[];
  const problems = tRaw.raw("verhuur.v2.problems") as ProblemItem[];
  const solutions = tRaw.raw("verhuur.v2.solutions") as SolutionItem[];
  const competitors = tRaw.raw("verhuur.v2.competitors") as CompetitorItem[];
  const plans = tRaw.raw("verhuur.v2.plans") as Plan[];

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd
        data={serviceLd({
          name: locale === "es" ? "Software para empresas de alquiler" : "Verhuursoftware op maat",
          description:
            locale === "es"
              ? "Sistema de reservas a medida para empresas de alquiler — un dashboard, facturas automáticas, contratos en un clic. Sin reservas duplicadas entre Airbnb, Booking y Excel."
              : "Maatwerk boekingssysteem voor verhuurbedrijven — één dashboard, automatische facturen, contracten in één klik. Geen dubbele boekingen meer tussen Airbnb, Booking en je Excel.",
          locale,
          url: siteUrl(locale === "es" ? "/es/alquiler" : "/verhuur"),
        })}
      />
      {/* HERO */}
      <header className="relative overflow-hidden px-6 pt-20 pb-[100px]">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-70 blur-[40px]"
          style={{
            background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
          }}
        />
        {/* Caravan — desktop-only ambient, sits over the accent blob.
            Component itself bails on touch / reduced-motion. */}
        <CaravanMount className="pointer-events-none absolute top-12 right-0 hidden aspect-square w-[520px] lg:block" />
        <div className="relative mx-auto max-w-[1200px]">
          <AvailabilityPill href="/contact">{t("eyebrow")}</AvailabilityPill>

          <AnimatedHeading
            as="h1"
            className="mt-7 max-w-[14ch] text-[clamp(44px,7vw,84px)] leading-[1.05]"
          >
            {t("title")}
          </AnimatedHeading>
          <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.55] text-(--color-muted)">
            {t("lede")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <MagneticButton>
              <Button asChild size="lg" variant="primary" className="group">
                <a href="#solution">
                  {t("ctaPrimary")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button asChild size="lg" variant="outline">
                <a href="#contact">{t("ctaSecondary")} →</a>
              </Button>
            </MagneticButton>
            {/* Tertiary link naar live demo — strategie zegt: hoogste-
                intentie pagina (verhuur) verdient een directe demo-deep-
                link. Geen modal nodig, hier weten ze al wat ze willen. */}
            <a
              href={`/${locale === "nl" ? "" : `${locale}/`}demo/portal`}
              className="ml-1 inline-flex items-center gap-1.5 text-[14px] text-(--color-text)/70 underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-text) hover:decoration-(--color-wine)"
            >
              {t("liveDemo")} →
            </a>
          </div>

          {/* Meta-row */}
          <div className="mt-[72px] flex flex-wrap gap-x-10 gap-y-6 border-t border-(--color-border) pt-9">
            {metaItems.map((m) => {
              // Try to extract a leading integer for animation; fall back to plain text.
              const numMatch = m.num.match(/^(\d+)(.*)$/);
              return (
                <div key={m.label}>
                  <div className="font-serif text-[34px] leading-none">
                    {numMatch ? (
                      <FlashCounter to={parseInt(numMatch[1]!, 10)} suffix={numMatch[2] ?? ""} />
                    ) : (
                      m.num
                    )}
                  </div>
                  <div className="mt-1.5 text-[13px] text-(--color-muted)">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="py-section bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <Eyebrow className="mb-[18px]">{t("problemEyebrow")}</Eyebrow>
            <AnimatedHeading as="h2" className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
              {t("problemTitle")}
            </AnimatedHeading>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("problemLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {problems.map((p, i) => {
              const Icon = PROBLEM_ICONS[i] ?? X;
              return (
                <RevealOnScroll key={p.title} delay={i * 0.08}>
                  <article className="hover:shadow-floating h-full rounded-[20px] border border-(--color-border) bg-(--color-surface) p-7 transition-all duration-300 hover:-translate-y-1 sm:p-9">
                    <div className="mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-red-100 text-red-600">
                      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </div>
                    <h3 className="mb-3 text-[24px] leading-[1.1]">{p.title}</h3>
                    <p className="text-[15px] leading-[1.6] text-(--color-muted)">{p.body}</p>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROI-CALCULATOR — maakt "scheelt je tijd" concreet in euro's */}
      <section className="py-section px-6">
        <div className="mx-auto max-w-[920px]">
          <RoiCalculator
            strings={{
              eyebrow: t("roi.eyebrow"),
              title: t("roi.title"),
              lede: t("roi.lede"),
              hoursLabel: t("roi.hoursLabel"),
              hoursUnit: t("roi.hoursUnit"),
              rateLabel: t("roi.rateLabel"),
              rateUnit: t("roi.rateUnit"),
              monthlyLabel: t("roi.monthlyLabel"),
              yearlyLabel: t("roi.yearlyLabel"),
              paybackLabel: t("roi.paybackLabel"),
              paybackUnit: t("roi.paybackUnit"),
              paybackMonthsName: t("roi.paybackUnit"),
              disclaimer: t("roi.disclaimer"),
              buildAmount: 8000,
            }}
          />
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="py-section px-6">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <Eyebrow className="mb-[18px]">{t("solutionEyebrow")}</Eyebrow>
            <AnimatedHeading as="h2" className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
              {t("solutionTitle")}
            </AnimatedHeading>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("solutionLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
            {solutions.map((s, i) => {
              const Icon = i === 0 ? Calendar : i === 1 ? FileText : CreditCard;
              const large = i === 0;
              return (
                <RevealOnScroll key={s.title} delay={i * 0.08}>
                  <article
                    className={`group hover:shadow-floating relative flex h-full flex-col rounded-[20px] border border-(--color-border) bg-(--color-surface) transition-all duration-300 hover:border-(--color-border-strong,#D8CDB6) ${
                      large ? "p-11 md:row-span-2" : "p-9"
                    }`}
                  >
                    <div className="mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-(--color-accent-soft) text-(--color-accent) transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:bg-(--color-accent) group-hover:text-white">
                      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </div>
                    <h3
                      className={
                        large ? "mb-3 text-[32px] leading-[1.1]" : "mb-3 text-[24px] leading-[1.1]"
                      }
                    >
                      {s.title}
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-(--color-muted)">{s.body}</p>
                    {s.bullets ? (
                      <ul className="mt-[22px] space-y-0 border-t border-(--color-border) pt-[22px]">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2.5 py-[5px] text-[14px] text-(--color-muted)"
                          >
                            <span
                              className="h-1 w-1 shrink-0 rounded-full bg-(--color-accent)"
                              aria-hidden
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPETITORS — wanneer SaaS niet meer past */}
      <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <Eyebrow className="mb-[18px]">{t("competitorsEyebrow")}</Eyebrow>
            <AnimatedHeading as="h2" className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
              {t("competitorsTitle")}
            </AnimatedHeading>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("competitorsLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {competitors.map((c, i) => (
              <RevealOnScroll key={c.name} delay={i * 0.06}>
                <article className="hover:shadow-floating flex h-full flex-col rounded-[18px] border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-1">
                  <h3 className="mb-3 font-serif text-[22px] leading-tight">{c.name}</h3>
                  <p className="mb-4 text-[14px] leading-[1.6] text-(--color-text)">{c.dna}</p>
                  <p className="mt-auto border-t border-(--color-border) pt-4 text-[13px] leading-[1.55] text-(--color-muted)">
                    <span className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                      breekt op:
                    </span>
                    <br />
                    {c.breaks}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="mt-12">
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-wine)/20 bg-(--color-wine)/5 px-4 py-2 font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
              <Clock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
              {t("competitorsClaim")}
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURED TESTIMONIAL */}
      <section className="bg-(--color-text) px-6 py-[80px] text-(--color-bg)">
        <RevealOnScroll className="mx-auto max-w-[760px] text-center">
          <QuoteMarkDraw size={64} className="mx-auto mb-6" />
          <blockquote className="mb-8 font-serif text-[clamp(24px,3vw,32px)] leading-[1.3] font-light text-(--color-bg)">
            {t("quoteText")}
          </blockquote>
          <div className="flex items-center justify-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-(--color-accent) text-[15px] font-semibold text-white">
              {t("quoteInitials")}
            </div>
            <div className="text-left">
              <div className="font-medium">{t("quoteName")}</div>
              <div className="text-[13px] text-(--color-bg)/65">{t("quoteRole")}</div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* PRICING */}
      <section className="py-section px-6">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <Eyebrow className="mb-[18px]">{t("pricingEyebrow")}</Eyebrow>
            <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">{t("pricingTitle")}</h2>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("pricingLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => {
              const featured = plan.id === "mid";
              return (
                <RevealOnScroll key={plan.id} delay={i * 0.08}>
                  <article
                    className={`relative flex h-full flex-col rounded-[28px] p-10 transition-all duration-300 ${
                      featured
                        ? "hover:shadow-modal scale-[1.02] border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:-translate-y-1.5 hover:scale-[1.02]"
                        : "hover:shadow-floating border border-(--color-border) bg-(--color-surface) hover:-translate-y-1.5"
                    }`}
                  >
                    {featured ? (
                      <span className="absolute -top-2.5 right-6 rounded-full bg-(--color-accent) px-3 py-1 text-[11px] font-medium text-white">
                        Meest gekozen
                      </span>
                    ) : null}
                    <h3 className={`mb-1.5 text-[24px] ${featured ? "text-(--color-bg)" : ""}`}>
                      {plan.name}
                    </h3>
                    <p
                      className={`mb-7 text-[14px] ${
                        featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                      }`}
                    >
                      {plan.desc}
                    </p>
                    <div
                      className={`font-serif text-[48px] leading-none ${
                        featured ? "text-(--color-bg)" : ""
                      }`}
                    >
                      {plan.price}
                    </div>
                    <span
                      className={`mt-1 mb-7 block text-[13px] ${
                        featured ? "text-(--color-bg)/60" : "text-(--color-muted)"
                      }`}
                    >
                      {plan.period}
                    </span>
                    <ul className="mb-8 flex-grow space-y-2">
                      {plan.items.map((item) => (
                        <li
                          key={item}
                          className={`flex items-start gap-2.5 text-[14px] ${
                            featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                          }`}
                        >
                          <Check
                            className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                              featured ? "text-(--color-accent-soft)" : "text-(--color-accent)"
                            }`}
                            strokeWidth={2.5}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={featured ? "ghost" : "outline"}
                      className={`w-full justify-center ${
                        featured
                          ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                          : ""
                      }`}
                    >
                      <a href="#contact">{plan.cta}</a>
                    </Button>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="contact"
        className="py-section relative overflow-hidden bg-(--color-bg-warm) px-6"
      >
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[80px]"
          style={{
            background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px]">
          <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
            <Eyebrow>{t("ctaEyebrow")}</Eyebrow>
            <h2 className="text-[clamp(36px,5vw,60px)]">{t("ctaTitle")}</h2>
            <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("ctaBody")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Button asChild size="lg" variant="primary" className="group">
                <a href="mailto:hello@webstability.eu?subject=Verhuursysteem%20%E2%80%94%20kennismaking">
                  hello@webstability.eu
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              <CalPopupTrigger
                locale={locale}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {t("ctaButton")} →
              </CalPopupTrigger>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
