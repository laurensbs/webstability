import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import {
  startCareCheckout,
  startCareCheckoutWithBuild,
  startAnonCheckout,
} from "@/app/actions/billing";
import { MarkupText } from "@/components/animate/MarkupText";
import {
  PricingCardsWithToggle,
  type PricingItem,
} from "@/components/marketing/PricingCardsWithToggle";
import { BuildCalculator } from "@/components/marketing/BuildCalculator";
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

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pricing");
  const tCare = await getTranslations("pricing.care");
  const tBuild = await getTranslations("pricing.build");
  const tCalc = await getTranslations("pricing.build.calculator");
  const tBuildOpts = await getTranslations("pricing.build.options");
  const tTierNames = await getTranslations("pricing.build.tierNames");
  const tPaths = await getTranslations("pricing.build.paths");
  const tRaw = await getTranslations();
  const careItems = tRaw.raw("pricing.care.items") as PricingItem[];
  const addons = tRaw.raw("pricing.addons") as string[];
  const reassurance = tRaw.raw("pricing.reassurance") as string[];
  const pathItems = tRaw.raw("pricing.build.paths.items") as Array<{
    what: string;
    package: string;
    build: string;
    after: string;
  }>;

  const session = await auth();
  const user = session?.user?.id ? await getUserWithOrg(session.user.id) : null;
  const isOwner = user?.role === "owner";
  const currentPlan = user?.organization?.plan ?? null;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="mx-auto mb-10 max-w-2xl text-center text-(--color-muted)">
            {tCare("intro")}
          </p>
          <PricingCardsWithToggle
            items={careItems}
            strings={{
              featuredLabel: tCare("subscribe"),
              monthlyLabel: tCare("billingMonthly"),
              annualLabel: tCare("billingAnnual"),
              annualHint: tCare("billingAnnualHint"),
              perMonth: tCare("perMonth"),
              perMonthBilledAnnually: tCare("perMonthBilledAnnually"),
              ctaLabel: tCare("talk"),
            }}
            authMode={{
              isOwner,
              currentPlan: currentPlan as "care" | "studio" | "atelier" | null,
              subscribeAction: startCareCheckout,
              anonSubscribeAction: startAnonCheckout,
              subscribeLabel: tCare("subscribe"),
              currentPlanLabel: tCare("currentPlan"),
            }}
          />
        </div>
      </section>

      {/* Build extensions + calculator */}
      <section className="border-t border-(--color-border) px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-10 max-w-3xl space-y-3">
            <h2 className="text-2xl md:text-3xl">{tBuild("title")}</h2>
            <p className="leading-relaxed text-(--color-muted)">{tBuild("lede")}</p>
          </RevealOnScroll>
          <BuildCalculator
            strings={{
              tierLabel: tCalc("tier"),
              buildLabel: tCalc("build"),
              monthsLabel: tCalc("months"),
              duringBuildLabel: tCalc("duringBuild"),
              afterBuildLabel: tCalc("afterBuild"),
              totalBuildLabel: tCalc("totalBuild"),
              ctaAuthenticated: tCalc("ctaAuthenticated"),
              ctaAnonymous: tCalc("ctaAnonymous"),
              perMonth: tCare("perMonth"),
              interpretationTemplate: tCalc("interpretationTemplate"),
              interpretationNone: tCalc("interpretationNone"),
              interpretationLabels: {
                none: tCalc("interpretationLabels.none"),
                light: tCalc("interpretationLabels.light"),
                standard: tCalc("interpretationLabels.standard"),
                custom: tCalc("interpretationLabels.custom"),
              },
              timelineDuring: tCalc("timelineDuring"),
              timelineAfter: tCalc("timelineAfter"),
              tierOptions: [
                { id: "care", name: tTierNames("care") },
                { id: "studio", name: tTierNames("studio") },
                { id: "atelier", name: tTierNames("atelier") },
              ],
              buildOptions: [
                { id: "none", name: tBuildOpts("none") },
                { id: "light", name: tBuildOpts("light") },
                { id: "standard", name: tBuildOpts("standard") },
                { id: "custom", name: tBuildOpts("custom") },
              ],
            }}
            authMode={
              isOwner ? { isOwner, subscribeAction: startCareCheckoutWithBuild } : undefined
            }
          />

          {/* Veelvoorkomende paden — concrete voorbeeld-tabel onder de calculator */}
          <RevealOnScroll className="mt-12 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl">{tPaths("title")}</h3>
              <p className="text-(--color-muted)">{tPaths("lede")}</p>
            </div>
            <div className="overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface)">
              <div className="hidden grid-cols-[1.4fr_1.4fr_1fr_1fr] gap-4 border-b border-(--color-border) bg-(--color-bg-warm) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase md:grid">
                <span>{tPaths("headers.what")}</span>
                <span>{tPaths("headers.package")}</span>
                <span>{tPaths("headers.build")}</span>
                <span>{tPaths("headers.after")}</span>
              </div>
              <ul className="divide-y divide-(--color-border)">
                {pathItems.map((row, i) => (
                  <li
                    key={i}
                    className="grid gap-2 px-5 py-4 md:grid-cols-[1.4fr_1.4fr_1fr_1fr] md:gap-4"
                  >
                    <p className="text-[15px] font-medium text-(--color-text)">{row.what}</p>
                    <p className="text-[14px] text-(--color-muted)">{row.package}</p>
                    <p className="text-[14px] text-(--color-text)">{row.build}</p>
                    <p className="text-[14px] text-(--color-text)">{row.after}</p>
                  </li>
                ))}
              </ul>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Reassurance + add-ons — gecombineerde strip onder calculator */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="mb-6 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {t("reassuranceTitle")}
            </h2>
            <ul className="space-y-3">
              {reassurance.map((r, i) => (
                <RevealOnScroll key={i} delay={i * 0.04}>
                  <li className="flex items-start gap-2.5 text-[14px] text-(--color-muted)">
                    <Check
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-(--color-accent)"
                      strokeWidth={2.5}
                    />
                    {r}
                  </li>
                </RevealOnScroll>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-6 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {t("addonsTitle")}
            </h2>
            <ul className="space-y-3">
              {addons.map((a, i) => (
                <RevealOnScroll key={i} delay={i * 0.04}>
                  <li className="border-b border-(--color-border) pb-3 text-[14px] text-(--color-muted)">
                    {a}
                  </li>
                </RevealOnScroll>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
