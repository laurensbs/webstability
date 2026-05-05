import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, getDashboardStats } from "@/lib/db/queries/portal";
import { StatCard } from "@/components/portal/StatCard";
import { DashboardIntro, StatsGrid, StatItem } from "@/components/portal/DashboardIntro";

function pickGreeting(t: (k: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("greeting.morning");
  if (h < 18) return t("greeting.afternoon");
  return t("greeting.evening");
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal");
  const stats = await getDashboardStats(user.organizationId);
  const firstName = (user.name ?? user.email).split(" ")[0]!.split("@")[0]!;
  const greeting = pickGreeting(t);

  const status = stats.hasHighPriority
    ? t("greeting.highPriority")
    : stats.openTickets > 0
      ? t("greeting.openTickets", { count: Number(stats.openTickets) })
      : t("greeting.allGood");

  return (
    <div className="space-y-12">
      <DashboardIntro greeting={greeting} firstName={firstName} status={status} />

      <StatsGrid>
        <StatItem>
          <StatCard label={t("stats.openTickets")} value={String(stats.openTickets)} />
        </StatItem>
        <StatItem>
          <StatCard label={t("stats.activeProjects")} value={String(stats.activeProjects)} />
        </StatItem>
        <StatItem>
          <StatCard label={t("stats.openInvoices")} value={String(stats.openInvoices)} />
        </StatItem>
        <StatItem>
          <StatCard label={t("stats.uptime")} value="—" hint="Phase 4" />
        </StatItem>
      </StatsGrid>
    </div>
  );
}
