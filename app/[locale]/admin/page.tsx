import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Building2, MessageSquare, FolderKanban, Receipt } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getStudioStats, getRecentAdminActivity } from "@/lib/db/queries/admin";
import { StatCard } from "@/components/portal/StatCard";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const [stats, events] = await Promise.all([getStudioStats(), getRecentAdminActivity(8)]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.orgs")} value={Number(stats.orgs)} icon={Building2} />
        <StatCard
          label={t("stats.openTickets")}
          value={Number(stats.openTickets)}
          icon={MessageSquare}
          accent={Number(stats.openTickets) > 0}
        />
        <StatCard
          label={t("stats.activeProjects")}
          value={Number(stats.activeProjects)}
          icon={FolderKanban}
        />
        <StatCard
          label={t("stats.openInvoices")}
          value={Number(stats.openInvoices)}
          icon={Receipt}
          accent={Number(stats.openInvoices) > 0}
        />
      </section>

      <AdminActivityFeed
        events={events}
        title={t("activity.title")}
        empty={t("activity.empty")}
        locale={locale}
      />
    </div>
  );
}
