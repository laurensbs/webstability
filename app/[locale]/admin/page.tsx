import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getStudioStats } from "@/lib/db/queries/admin";
import { StatCard } from "@/components/portal/StatCard";

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const stats = await getStudioStats();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.orgs")} value={String(stats.orgs)} />
        <StatCard label={t("stats.openTickets")} value={String(stats.openTickets)} />
        <StatCard label={t("stats.activeProjects")} value={String(stats.activeProjects)} />
        <StatCard label={t("stats.openInvoices")} value={String(stats.openInvoices)} />
      </section>
    </div>
  );
}
