import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { AnimatedCheck } from "@/components/marketing/AnimatedCheck";
import { BuildTimeline } from "@/components/marketing/diensten/BuildTimeline";
import { NotForSection } from "@/components/marketing/diensten/NotForSection";
import type { Metadata } from "next";
import { pageMetadata, serviceLd, siteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "diensten");
}

// Verhuurplatform is de strategische wig. Bedrijfssoftware en webshop
// daarna. Care/onderhoud sluit als doorlopend abonnement.
const SOLUTION_KEYS = ["verhuurplatform", "platform", "webshop", "care"] as const;

type HeroMetric = { value: string; label: string };

type ProductItem = {
  anchor: string;
  eyebrow: string;
  title: string;
  dnaLine: string;
  pricePill: string;
  solvesTitle: string;
  solves: string[];
  includesTitle: string;
  includes: string[];
  afterBuild: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("servicesPage");
  const tRaw = await getTranslations();
  const heroMetrics = tRaw.raw("servicesPage.heroMetrics") as HeroMetric[];
  const timeline = tRaw.raw("servicesPage.timeline") as {
    eyebrow: string;
    title: string;
    lede: string;
    steps: Array<{ week: string; title: string; body: string }>;
  };
  const notFor = tRaw.raw("servicesPage.notFor") as {
    eyebrow: string;
    title: string;
    lede: string;
    scenarios: Array<{ title: string; body: string }>;
  };

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd
        data={serviceLd({
          name: locale === "es" ? "Desarrollo de software a medida" : "Software op maat",
          description:
            locale === "es"
              ? "Plataformas de alquiler y reparación, tiendas online y software de gestión a medida — precio fijo, entrega en 4 semanas, mantenimiento continuo. Para pymes en Países Bajos y España."
              : "Verhuur- en reparatieplatforms, webshops en admin-systemen op maat — vaste prijs, levering in 4 weken, doorlopend onderhoud. Voor MKB in Nederland en Spanje.",
          locale,
          url: siteUrl(locale === "es" ? "/es/servicios" : "/diensten"),
        })}
      />
      {/* HERO — rustig: dark bg, één terracotta-halo, serif h1 + lede,
          drie metric-cijfers rechts (geen wireframe, geen 3D-blob). */}
      <section className="relative isolate overflow-hidden bg-(--color-text) text-(--color-bg)">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-30 blur-3xl"
        />

        <div className="py-section relative mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
              {"// "}
              {t("eyebrow")}
            </p>
            <h1 className="max-w-[18ch] font-serif text-[clamp(36px,5.5vw,64px)] leading-[1.05] text-(--color-bg)">
              <MarkupText>{t("title")}</MarkupText>
            </h1>
            <p className="max-w-[56ch] text-[17px] leading-[1.65] text-(--color-bg)/70">
              {t("lede")}
            </p>
          </div>

          {/* Metric-trio rechts — drie cijfers die het verhaal samenvatten.
              Consistent met /over "Wat ik nu bouw" en /diensten hero. */}
          <ul className="grid gap-5">
            {heroMetrics.map((m) => (
              <li key={m.label} className="border-l-2 border-(--color-accent)/60 pl-5">
                <p className="font-serif text-[44px] leading-none text-(--color-bg) md:text-[56px]">
                  {m.value}
                </p>
                <p className="mt-2 max-w-[28ch] font-mono text-[11px] tracking-widest text-(--color-bg)/60 uppercase">
                  {m.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4-WEKEN-RIB — één keer, generiek voor alle builds */}
      <BuildTimeline strings={timeline} />

      {/* PRODUCTLIJNEN — cream cards, terracotta accent, één prijs per kaart */}
      <div className="dotted-bg flex flex-1 flex-col">
        <section className="py-section md:py-section px-6">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {SOLUTION_KEYS.map((key) => {
              const item = tRaw.raw(`servicesPage.items.${key}`) as ProductItem;
              const isExternal = item.ctaSecondaryHref.startsWith("/");
              return (
                <RevealOnScroll key={key}>
                  <article
                    id={item.anchor}
                    className="group hover:shadow-floating rounded-panel relative flex h-full flex-col border border-(--color-border) bg-(--color-surface) p-7 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-accent)/40 sm:p-9"
                  >
                    <header className="space-y-3">
                      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                        {"// "}
                        {item.eyebrow}
                      </p>
                      <h2 className="text-2xl leading-tight md:text-[28px]">{item.title}</h2>
                      <p className="text-[15px] leading-[1.6] text-(--color-muted)">
                        {item.dnaLine}
                      </p>
                      <span className="inline-flex w-fit items-center rounded-full border border-(--color-accent)/30 bg-(--color-accent-soft)/40 px-3 py-1 font-mono text-[11px] tracking-wide text-(--color-accent)">
                        {item.pricePill}
                      </span>
                    </header>

                    <div className="mt-7 grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                          {item.solvesTitle}
                        </h3>
                        <ul className="space-y-2">
                          {item.solves.map((s, i) => (
                            <li
                              key={s}
                              className="flex items-start gap-2 text-[13px] leading-[1.55] text-(--color-muted)"
                            >
                              <span className="mt-1 shrink-0">
                                <AnimatedCheck delay={i * 0.06} />
                              </span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="mb-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                          {item.includesTitle}
                        </h3>
                        <ul className="space-y-2">
                          {item.includes.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-[13px] leading-[1.55] text-(--color-text)"
                            >
                              <span
                                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--color-accent)"
                                aria-hidden
                              />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <p className="mt-7 border-t border-(--color-border) pt-5 text-[13px] leading-[1.55] text-(--color-muted)">
                      {item.afterBuild}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <CalPopupTrigger
                        locale={locale}
                        className={buttonVariants({ variant: "accent", size: "sm" })}
                      >
                        {item.ctaPrimary}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </CalPopupTrigger>
                      {isExternal ? (
                        <a
                          href={item.ctaSecondaryHref}
                          className="text-[13px] font-medium text-(--color-accent) transition-colors hover:text-(--color-wine)"
                        >
                          {item.ctaSecondary}
                        </a>
                      ) : null}
                    </div>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>

        {/* VERDIEPING PER DIENST — interne links naar de verticaal-
            pagina's. Crawlbaar voor Google + handig voor bezoekers die
            een specifieke dienst willen uitdiepen. */}
        <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {"// "}
              {locale === "es" ? "Más en detalle" : "Per dienst, in detail"}
            </p>
            <ul className="flex flex-wrap gap-3">
              <li>
                <Link
                  href={{
                    pathname: "/diensten/[vertical]",
                    params: { vertical: "verhuur-boekingssysteem" },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es"
                    ? "Sistema de reservas de alquiler"
                    : "Verhuur-boekingssysteem op maat"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
              <li>
                <Link
                  href={{
                    pathname: "/diensten/[vertical]",
                    params: { vertical: "klantportaal-laten-bouwen" },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es" ? "Portal de cliente a medida" : "Klantportaal laten bouwen"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
              <li>
                <Link
                  href={{
                    pathname: "/diensten/[vertical]",
                    params: { vertical: "admin-systeem-op-maat" },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es" ? "Sistema interno a medida" : "Admin-systeem op maat"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
              <li>
                <Link
                  href={{
                    pathname: "/diensten/[vertical]",
                    params: { vertical: "reparatie-portaal" },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es" ? "Portal de reparaciones" : "Reparatie-portaal"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/verhuur" }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es"
                    ? "Software para empresas de alquiler"
                    : "Software voor verhuurbedrijven"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/aanvragen" }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-accent)/50 bg-(--color-accent-soft)/40 px-4 py-2 text-[13px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)"
                >
                  {locale === "es"
                    ? "Solicita tu web o tienda online →"
                    : "Vraag je website of webshop aan →"}
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/faq" }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[13px] text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                >
                  {locale === "es" ? "Preguntas frecuentes" : "Veelgestelde vragen"}
                  <ArrowRight className="h-3 w-3 text-(--color-muted)" />
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* EERLIJKE AFBAKENING — wanneer ben je beter af elders? */}
        <NotForSection strings={notFor} />

        {/* FOOTER-CTA */}
        <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
          <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
            <h2 className="text-h2">{t("footerCtaTitle")}</h2>
            <p className="text-(--color-muted)">{t("footerCtaBody")}</p>
            <div className="flex justify-center pt-2">
              <Button asChild variant="outline">
                <Link href="/cases">
                  {t("footerCtaLabel")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </RevealOnScroll>
        </section>
      </div>
    </main>
  );
}
