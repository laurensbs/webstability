import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Globe, ShoppingBag, LayoutDashboard, KeyRound, type LucideIcon } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { startCareCheckout } from "@/app/actions/billing";
import { MarkupText } from "@/components/animate/MarkupText";
import {
  PricingCardsWithToggle,
  type PricingItem,
} from "@/components/marketing/PricingCardsWithToggle";

const BUILD_ICONS: LucideIcon[] = [Globe, ShoppingBag, LayoutDashboard, KeyRound];

type BuildItem = { name: string; price: string; body: string };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pricing");
  const tCare = await getTranslations("pricing.care");
  const tRaw = await getTranslations();
  const buildItems = tRaw.raw("pricing.build.items") as BuildItem[];
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
          <Tabs defaultValue="care" className="flex flex-col items-center">
            <TabsList>
              <TabsTrigger value="build">{t("tabBuild")}</TabsTrigger>
              <TabsTrigger value="care">{t("tabCare")}</TabsTrigger>
            </TabsList>

            <TabsContent value="build" className="mt-12 w-full">
              <p className="mx-auto mb-10 max-w-2xl text-center text-(--color-muted)">
                {t("build.intro")}
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {buildItems.map((item, i) => {
                  const Icon = BUILD_ICONS[i] ?? Globe;
                  return (
                    <RevealOnScroll key={i} delay={i * 0.05}>
                      <article className="group flex h-full flex-col rounded-[28px] border border-(--color-border) bg-(--color-surface) p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]">
                        <div className="mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-(--color-accent-soft) text-(--color-accent) transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:bg-(--color-accent) group-hover:text-white">
                          <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-[24px]">{item.name}</h3>
                          <p className="font-mono text-sm text-(--color-accent)">{item.price}</p>
                        </div>
                        <p className="mt-3 text-[15px] leading-[1.6] text-(--color-muted)">
                          {item.body}
                        </p>
                      </article>
                    </RevealOnScroll>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="care" className="mt-12 w-full">
              <p className="mx-auto mb-10 max-w-2xl text-center text-(--color-muted)">
                {t("care.intro")}
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
                  currentPlan: currentPlan as "basic" | "pro" | "partner" | null,
                  subscribeAction: startCareCheckout,
                  subscribeLabel: tCare("subscribe"),
                  currentPlanLabel: tCare("currentPlan"),
                }}
              />
            </TabsContent>
          </Tabs>
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

      <section className="px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl md:text-3xl">{t("philosophyTitle")}</h2>
          <p className="leading-relaxed text-(--color-muted)">{t("philosophyBody")}</p>
        </RevealOnScroll>
      </section>
    </main>
  );
}
