import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, getOrgSeoHours } from "@/lib/db/queries/portal";
import { SeoOverview } from "@/components/portal/seo/SeoOverview";
import { SeoUpsell } from "@/components/portal/seo/SeoUpsell";

/**
 * /portal/seo — Studio+/Atelier-tier krijgt de SeoOverview met
 * metric-cards (leeg-state als GSC nog niet gekoppeld is) + de SEO-
 * uren-feed. Care-tier krijgt de SeoUpsell-card.
 */
export default async function SeoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal.seo");
  const tRaw = await getTranslations();
  const plan = user.organization?.plan ?? "care";
  const isStudioPlus = plan === "studio" || plan === "atelier";

  if (!isStudioPlus) {
    const upsellBullets = tRaw.raw("portal.seo.upsell.bullets") as string[];
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <SeoUpsell
          strings={{
            eyebrow: t("upsell.eyebrow"),
            title: t("upsell.title"),
            body: t("upsell.body"),
            bullets: upsellBullets,
            cta: t("upsell.cta"),
          }}
        />
      </div>
    );
  }

  const hours = await getOrgSeoHours(user.organizationId, 30);

  // GSC-OAuth nog niet wired — alle metrics null. Component toont
  // leeg-state met "koppel je Search Console"-pill.
  const metrics = {
    avgRanking: null,
    impressions30d: null,
    clicks30d: null,
    ctr30d: null,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("intro")}</p>
      </div>
      <SeoOverview
        metrics={metrics}
        hours={hours}
        locale={locale}
        strings={{
          metricsTitle: t("overview.metricsTitle"),
          metricsEmpty: t("overview.metricsEmpty"),
          metrics: {
            avgRanking: t("overview.metrics.avgRanking"),
            impressions: t("overview.metrics.impressions"),
            clicks: t("overview.metrics.clicks"),
            ctr: t("overview.metrics.ctr"),
          },
          rankingsTitle: t("overview.rankingsTitle"),
          rankingsEmpty: t("overview.rankingsEmpty"),
          hoursTitle: t("overview.hoursTitle"),
          hoursEmpty: t("overview.hoursEmpty"),
          connectGsc: t("overview.connectGsc"),
        }}
      />
    </div>
  );
}
