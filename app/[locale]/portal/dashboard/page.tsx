import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { Activity, Inbox, FolderKanban, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import {
  getUserWithOrg,
  getDashboardStats,
  listOrgProjects,
  listOrgTickets,
} from "@/lib/db/queries/portal";
import { StatCard } from "@/components/portal/StatCard";
import { StatusBanner } from "@/components/portal/StatusBanner";
import { RecentProjects } from "@/components/portal/RecentProjects";
import { RecentTickets } from "@/components/portal/RecentTickets";
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
  const tProjects = await getTranslations("portal.projects");
  const [stats, projects, tickets] = await Promise.all([
    getDashboardStats(user.organizationId),
    listOrgProjects(user.organizationId),
    listOrgTickets(user.organizationId),
  ]);
  const firstName = (user.name ?? user.email).split(" ")[0]!.split("@")[0]!;
  const greeting = pickGreeting(t);

  const status = stats.hasHighPriority
    ? t("greeting.highPriority")
    : stats.openTickets > 0
      ? t("greeting.openTickets", { count: Number(stats.openTickets) })
      : t("greeting.allGood");

  const healthy = !stats.hasHighPriority && stats.openTickets === 0;

  return (
    <div className="space-y-10">
      <DashboardIntro greeting={greeting} firstName={firstName} status={status} />

      <StatusBanner
        healthy={healthy}
        message={healthy ? t("banner.healthy") : t("banner.issue")}
        cta={t("banner.viewStatus")}
      />

      <StatsGrid>
        <StatItem>
          <StatCard
            label={t("stats.openTickets")}
            value={Number(stats.openTickets)}
            icon={Inbox}
            accent={Number(stats.openTickets) > 0}
          />
        </StatItem>
        <StatItem>
          <StatCard
            label={t("stats.activeProjects")}
            value={Number(stats.activeProjects)}
            icon={FolderKanban}
          />
        </StatItem>
        <StatItem>
          <StatCard
            label={t("stats.openInvoices")}
            value={Number(stats.openInvoices)}
            icon={Receipt}
            accent={Number(stats.openInvoices) > 0}
          />
        </StatItem>
        <StatItem>
          <StatCard
            label={t("stats.uptime")}
            value="99.98%"
            icon={Activity}
            trend={{ value: "+0.04%", direction: "up" }}
          />
        </StatItem>
      </StatsGrid>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <RecentProjects
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            type: p.type,
            progress: p.progress,
          }))}
          title={t("dashboard.recentProjects")}
          empty={t("dashboard.noProjects")}
          viewAll={t("dashboard.viewAll")}
          statusLabel={(s: string) => tProjects(`status.${s}`)}
        />
        <RecentTickets
          tickets={tickets.map((tk) => ({
            id: tk.id,
            subject: tk.subject,
            status: tk.status,
            priority: tk.priority,
            createdAt: tk.createdAt,
            user: tk.user ?? null,
          }))}
          title={t("dashboard.recentTickets")}
          empty={t("dashboard.noTickets")}
          viewAll={t("dashboard.viewAll")}
          locale={locale}
        />
      </div>
    </div>
  );
}
