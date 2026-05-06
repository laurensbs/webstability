import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { startCareCheckout, startCareCheckoutWithBuild } from "@/app/actions/billing";
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
  const tPhilo = await getTranslations("pricing.philosophy");
  const tBuild = await getTranslations("pricing.build");
  const tCalc = await getTranslations("pricing.build.calculator");
  const tBuildOpts = await getTranslations("pricing.build.options");
  const tTierNames = await getTranslations("pricing.build.tierNames");
  const tRaw = await getTranslations();
  const careItems = tRaw.raw("pricing.care.items") as PricingItem[];
  const addons = tRaw.raw("pricing.addons") as string[];

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
        </div>
      </section>

      {/* Philosophy: three-column "voor jou / voor ons / voor het werk" */}
      <section className="border-t border-(--color-border) bg-(--color-text) px-6 py-24 text-(--color-bg)">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll className="mb-12 max-w-3xl space-y-4">
            <h2 className="text-2xl md:text-3xl">{t("philosophyTitle")}</h2>
            <p className="leading-relaxed text-(--color-bg)/75">{t("philosophyBody")}</p>
          </RevealOnScroll>
          <div className="grid gap-8 md:grid-cols-3">
            {(
              [
                ["voorJouTitle", "voorJouBody"],
                ["voorOnsTitle", "voorOnsBody"],
                ["voorWerkTitle", "voorWerkBody"],
              ] as const
            ).map(([titleKey, bodyKey], i) => (
              <RevealOnScroll key={titleKey} delay={i * 0.06}>
                <h3 className="font-mono text-[11px] tracking-widest text-(--color-accent-soft) uppercase">
                  {tPhilo(titleKey)}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-(--color-bg)/80">
                  {tPhilo(bodyKey)}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll>
            <h2 className="text-2xl md:text-3xl">{t("addonsTitle")}</h2>
          </RevealOnScroll>
          <ul className="mt-8 space-y-3">
            {addons.map((a, i) => (
              <RevealOnScroll key={i} delay={i * 0.04}>
                <li className="border-b border-(--color-border) pb-3 text-(--color-muted)">{a}</li>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
