import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { Button } from "@/components/ui/Button";
import { AnimatedCheck } from "@/components/marketing/AnimatedCheck";
import { PlatformIllustration } from "@/components/marketing/illustrations/PlatformIllustration";
import { WebshopIllustration } from "@/components/marketing/illustrations/WebshopIllustration";
import { CareIllustration } from "@/components/marketing/illustrations/CareIllustration";
import { GrowthIllustration } from "@/components/marketing/illustrations/GrowthIllustration";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "diensten");
}

const SOLUTION_KEYS = ["platform", "webshop", "care", "growth"] as const;

const ILLUSTRATIONS: Record<(typeof SOLUTION_KEYS)[number], React.ComponentType> = {
  platform: PlatformIllustration,
  webshop: WebshopIllustration,
  care: CareIllustration,
  growth: GrowthIllustration,
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("servicesPage");
  const tRaw = await getTranslations();

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      {SOLUTION_KEYS.map((key, i) => {
        const item = tRaw.raw(`servicesPage.items.${key}`) as {
          anchor: string;
          eyebrow: string;
          title: string;
          what: string;
          solvesTitle: string;
          solves: string[];
          includesTitle: string;
          includes: string[];
          packageTitle: string;
          packageBody: string;
          exampleTitle: string;
          exampleBody: string;
          ctaPrimary: string;
          ctaSecondary: string;
          ctaSecondaryHref: string;
        };
        const altRow = i % 2 === 1;
        // Sectie 1 + 3 krijgen een wijn-rode top-hairline — earned
        // wijn-rood zonder de "premium accent"-regel te breken.
        const wineDivider = i === 0 || i === 2;
        const Illustration = ILLUSTRATIONS[key];

        return (
          <section
            key={key}
            id={item.anchor}
            className={`scroll-mt-24 px-6 py-20 md:py-28 ${
              wineDivider ? "border-t-2 border-(--color-wine)/40" : ""
            } ${altRow ? "border-y border-(--color-border) bg-(--color-bg-warm)" : ""}`}
          >
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr]">
              {/* Left — illustratie + eyebrow + titel + wat het oplost */}
              <RevealOnScroll className="space-y-6">
                {/* Mini-illustratie — stagger-anker per service */}
                <div className="relative -mx-2 aspect-[16/10] overflow-hidden rounded-[18px] border border-(--color-border) bg-(--color-surface) shadow-[0_8px_24px_-12px_rgba(31,27,22,0.08)]">
                  <Illustration />
                </div>

                <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                  {"// "}
                  {item.eyebrow}
                </p>
                <h2 className="text-3xl leading-[1.1] md:text-5xl">{item.title}</h2>
                <p className="text-[17px] leading-[1.65] text-(--color-muted)">{item.what}</p>

                <div className="space-y-3">
                  <h3 className="font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                    {item.solvesTitle}
                  </h3>
                  <ul className="space-y-2.5">
                    {item.solves.map((s, idx) => (
                      <li
                        key={s}
                        className="flex items-start gap-2.5 text-[15px] text-(--color-muted)"
                      >
                        <span className="mt-1 shrink-0">
                          <AnimatedCheck delay={idx * 0.08} />
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>

              {/* Right — wat erbij zit + pakket + voorbeeld + CTA */}
              <RevealOnScroll
                delay={0.08}
                className="group space-y-6 rounded-[24px] border border-(--color-border) bg-(--color-surface) p-8 shadow-[0_1px_2px_rgba(31,27,22,0.04),0_4px_12px_-4px_rgba(31,27,22,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-(--color-accent)/40 hover:shadow-[0_2px_4px_rgba(31,27,22,0.06),0_24px_48px_-12px_rgba(201,97,79,0.18)] md:p-10"
              >
                <div>
                  <h3 className="mb-4 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                    {item.includesTitle}
                  </h3>
                  <ul className="space-y-2">
                    {item.includes.map((f, idx) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[14px] text-(--color-muted)"
                      >
                        <span className="mt-1 shrink-0">
                          <AnimatedCheck delay={idx * 0.06} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pakket-info met wijn-rode top-border — premium "earned" accent */}
                <div className="rounded-[14px] border border-t-2 border-(--color-border) border-t-(--color-wine)/60 bg-(--color-bg-warm) p-5">
                  <h4 className="mb-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                    {item.packageTitle}
                  </h4>
                  <p className="text-[14px] leading-[1.6] text-(--color-muted)">
                    <MarkupText>{item.packageBody}</MarkupText>
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                    {item.exampleTitle}
                  </h4>
                  <p className="text-[14px] leading-[1.6] text-(--color-text)">
                    <MarkupText>{item.exampleBody}</MarkupText>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button asChild variant="primary">
                    <Link href="/contact">
                      {item.ctaPrimary}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <a
                    href={item.ctaSecondaryHref}
                    className="text-[14px] font-medium text-(--color-accent) hover:underline"
                  >
                    {item.ctaSecondary}
                  </a>
                </div>
              </RevealOnScroll>
            </div>
          </section>
        );
      })}

      {/* Footer-CTA naar /cases */}
      <section className="border-t border-(--color-border) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-2xl md:text-4xl">{t("footerCtaTitle")}</h2>
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
    </main>
  );
}
