import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { Activity, Inbox, FolderKanban, Receipt } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

function lastSeenLine(
  t: (k: string, vars?: Record<string, number>) => string,
  lastLoginAt: Date | null,
): string {
  if (!lastLoginAt) return t("greeting.firstVisit");
  const ms = Date.now() - lastLoginAt.getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return t("greeting.lastSeenMinutes", { n: Math.max(1, minutes) });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("greeting.lastSeenHours", { n: hours });
  const days = Math.round(hours / 24);
  if (days < 14) return t("greeting.lastSeenDays", { n: days });
  const weeks = Math.round(days / 7);
  return t("greeting.lastSeenWeeks", { n: weeks });
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

  // Compute "last seen" from the previous login, then bump it. The user
  // sees how long it's been since they last looked at the portal.
  const subStatus = lastSeenLine(t, user.lastLoginAt ?? null);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const healthy = !stats.hasHighPriority && stats.openTickets === 0;

  return (
    <div className="space-y-10">
      <DashboardIntro
        greeting={greeting}
        firstName={firstName}
        status={status}
        subStatus={subStatus}
      />

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
