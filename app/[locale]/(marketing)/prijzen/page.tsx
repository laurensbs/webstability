import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { PanelPricingTable, type Panel } from "@/components/marketing/PanelPricingTable";
import { PANEL_MONTHLY_PRICE } from "@/lib/verticals";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "prijzen");
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pricingPage");
  const tRaw = await getTranslations();

  const panels: Panel[] = [
    {
      key: "verhuur",
      label: t("panels.verhuur.label"),
      blurb: t("panels.verhuur.blurb"),
      monthly: PANEL_MONTHLY_PRICE["verhuur-boekingssysteem"],
      features: tRaw.raw("pricingPage.panels.verhuur.features") as string[],
      featured: true,
      featuredLabel: t("featuredLabel"),
    },
    {
      key: "reparatie",
      label: t("panels.reparatie.label"),
      blurb: t("panels.reparatie.blurb"),
      monthly: PANEL_MONTHLY_PRICE["reparatie-portaal"],
      features: tRaw.raw("pricingPage.panels.reparatie.features") as string[],
    },
    {
      key: "klantportaal",
      label: t("panels.klantportaal.label"),
      blurb: t("panels.klantportaal.blurb"),
      monthly: PANEL_MONTHLY_PRICE["klantportaal-laten-bouwen"],
      features: tRaw.raw("pricingPage.panels.klantportaal.features") as string[],
    },
    {
      key: "admin",
      label: t("panels.admin.label"),
      blurb: t("panels.admin.blurb"),
      monthly: PANEL_MONTHLY_PRICE["admin-systeem-op-maat"],
      features: tRaw.raw("pricingPage.panels.admin.features") as string[],
    },
  ];

  const reassurance = tRaw.raw("pricingPage.reassurance") as string[];

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      {/* Hoofdsectie: vier panelen */}
      <section className="px-6 pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <PanelPricingTable
            panels={panels}
            ctaLabel={t("ctaLabel")}
            perMonthLabel={t("perMonth")}
            allInclusiveLabel={t("allInclusive")}
          />
        </div>
      </section>

      {/* Reassurance: wat zit er in elk abonnement */}
      <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll className="mb-8">
            <h2 className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {t("reassuranceTitle")}
            </h2>
          </RevealOnScroll>
          <ul className="space-y-3">
            {reassurance.map((r, i) => (
              <RevealOnScroll key={i} delay={i * 0.04}>
                <li className="flex items-start gap-2.5 text-[15px] text-(--color-text)">
                  <Check
                    className="mt-1 h-4 w-4 shrink-0 text-(--color-accent)"
                    strokeWidth={2.5}
                  />
                  {r}
                </li>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      {/* Hoe het werkt — kort 3-stappen verhaal */}
      <section className="py-section border-t border-(--color-border) px-6">
        <div className="mx-auto max-w-4xl">
          <RevealOnScroll className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-h2">{t("howItWorks.title")}</h2>
            <p className="text-(--color-muted)">{t("howItWorks.lede")}</p>
          </RevealOnScroll>
          <div className="grid gap-4 md:grid-cols-3">
            {(
              tRaw.raw("pricingPage.howItWorks.steps") as Array<{
                step: string;
                title: string;
                body: string;
              }>
            ).map((s, i) => (
              <RevealOnScroll key={i} delay={i * 0.06}>
                <div className="rounded-card h-full border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                    {s.step}
                  </p>
                  <h3 className="mt-2 text-[16px] font-medium text-(--color-text)">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.55] text-(--color-muted)">{s.body}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-section border-t border-(--color-border) px-6">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-h2">{t("footerCtaTitle")}</h2>
          <p className="text-(--color-muted)">{t("footerCtaBody")}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild variant="primary">
              <Link href="/aanvragen">
                {t("footerCtaPrimary")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <CalPopupTrigger locale={locale} className={buttonVariants({ variant: "outline" })}>
              {t("footerCtaSecondary")}
              <ArrowRight className="h-3.5 w-3.5" />
            </CalPopupTrigger>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
