import { Suspense } from "react";
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
  listOrgInvoices,
  getOrgHoursThisMonth,
  getActiveBuildPhase,
  getRecentLivegangs,
  getActiveIncidentsForOrg,
} from "@/lib/db/queries/portal";
import { StatCard } from "@/components/portal/StatCard";
import { StatusBanner } from "@/components/portal/StatusBanner";
import { RecentProjects } from "@/components/portal/RecentProjects";
import { RecentTickets } from "@/components/portal/RecentTickets";
import { RecentInvoices } from "@/components/portal/RecentInvoices";
import { SeoSparkline } from "@/components/portal/SeoSparkline";
import {
  MonitoringCardAsync,
  MonitoringCardSkeleton,
} from "@/components/portal/MonitoringCardAsync";
import { DashboardIntro, StatsGrid, StatItem } from "@/components/portal/DashboardIntro";
import { AuthVerifiedBeacon } from "@/components/auth/AuthVerifiedBeacon";
import { LivegangCelebration } from "@/components/portal/LivegangCelebration";
import { IncidentBanner } from "@/components/portal/IncidentBanner";
import { daysUntil } from "@/lib/format-age";
import { HoursWidget } from "@/components/portal/HoursWidget";
import { SecurityCard } from "@/components/portal/SecurityCard";
import { RoadmapCard } from "@/components/portal/RoadmapCard";
import { DeliveryCard } from "@/components/portal/DeliveryCard";
import { budgetMinutesFor, type TierId } from "@/lib/plan-budget";
import type { Monitor } from "@/lib/better-stack";

function pickGreeting(t: (k: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("greeting.morning");
  if (h < 18) return t("greeting.afternoon");
  return t("greeting.evening");
}

/**
 * Bereken voortgang en resterende dagen van een build-fase. Geïsoleerd
 * van het component-render zodat de purity-rule (`Date.now` ≠ pure)
 * niet aanslaat.
 */
function computeBuildPhaseProps(
  phase: { startedAt: Date; endsAt: Date } | null | undefined,
): { pct: number; daysRemaining: number } | null {
  if (!phase) return null;
  const nowMs = Date.now();
  const total = phase.endsAt.getTime() - phase.startedAt.getTime();
  const elapsed = Math.max(0, nowMs - phase.startedAt.getTime());
  const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  const daysRemaining = Math.round((phase.endsAt.getTime() - nowMs) / (1000 * 60 * 60 * 24));
  return { pct, daysRemaining };
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
  const tInvoices = await getTranslations("portal.invoices");
  const tStatus = await getTranslations("status");
  const [stats, projects, tickets, invoices, hours, buildPhase, recentLivegangs, incidents] =
    await Promise.all([
      getDashboardStats(user.organizationId),
      listOrgProjects(user.organizationId),
      listOrgTickets(user.organizationId),
      listOrgInvoices(user.organizationId),
      getOrgHoursThisMonth(user.organizationId),
      getActiveBuildPhase(user.organizationId),
      getRecentLivegangs(user.organizationId, 7),
      getActiveIncidentsForOrg(user.organizationId),
    ]);
  const tLivegang = await getTranslations("portal.livegang");
  const tIncident = await getTranslations("portal.incident");
  const tRot = await getTranslations("portal.subTagline");
  const dateFmtLivegang = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const dateFmtIncident = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Rotating sub-tagline messages — alleen tonen wat van toepassing is.
  // Geen open tickets → "alles draait"-message; build-phase actief →
  // "X dagen tot live"-message; openstaande factuur → "factuur klaar".
  const rotatingMessages: string[] = [];
  if (Number(stats.openTickets) === 0) {
    rotatingMessages.push(tRot("noTickets"));
  }
  if (buildPhase) {
    const daysToEnd = Math.max(0, daysUntil(buildPhase.endsAt));
    rotatingMessages.push(tRot("buildLive", { days: daysToEnd }));
  }
  const unpaidInvoice = invoices.find((i) => i.status === "sent");
  if (unpaidInvoice) {
    rotatingMessages.push(tRot("invoiceReady"));
  }

  // Tier-aware widget visibility — Care krijgt alleen Hours + Security,
  // Studio voegt SEO + Performance toe (al aanwezig), Atelier krijgt
  // ook nog een mini-roadmap met active projecten.
  const plan = (user.organization?.plan ?? null) as TierId | null;
  const budgetMinutes = budgetMinutesFor(plan);
  const showSeoSparkline = plan === "studio" || plan === "atelier";
  const showRoadmap = plan === "atelier";

  const buildPhaseProps = computeBuildPhaseProps(buildPhase);

  // Build de roadmap-items uit recent projects: laatste 'live' wordt
  // 'shipped', huidige 'in_progress' wordt 'active', 'planning' wordt
  // 'next'. Max 4 items.
  const roadmapItems = projects
    .map((p) => {
      const status =
        p.status === "live" || p.status === "done"
          ? ("shipped" as const)
          : p.status === "in_progress" || p.status === "review"
            ? ("active" as const)
            : ("next" as const);
      return { id: p.id, label: p.name, status };
    })
    .slice(0, 4);

  const monitorStatusLabels: Record<Monitor["status"], string> = {
    up: tStatus("labelOperational"),
    down: tStatus("labelDown"),
    paused: tStatus("labelPaused"),
    pending: tStatus("labelUnknown"),
    maintenance: tStatus("labelDegraded"),
    validating: tStatus("labelUnknown"),
  };
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
      <AuthVerifiedBeacon />

      {/* Incident-banners — wijn-rood, één per actief incident. Geen
          dismiss; verdwijnen vanzelf zodra de monitoring-cron resolved. */}
      {incidents.map((inc) => (
        <IncidentBanner
          key={inc.id}
          projectName={inc.projectName ?? "—"}
          startedAt={inc.startedAt}
          href={`/${locale}/portal/monitoring`}
          dateFmt={dateFmtIncident}
          strings={{
            title: tIncident("title"),
            since: tIncident("since"),
            cta: tIncident("cta"),
          }}
        />
      ))}

      {/* Livegang-feestmoment — toont voor projecten die binnen de
          afgelopen 7 dagen live zijn gegaan. Per project dismissable. */}
      {recentLivegangs.map((proj) => (
        <LivegangCelebration
          key={proj.id}
          projectId={proj.id}
          projectName={proj.name}
          projectUrl={proj.monitoringTargetUrl}
          liveAt={proj.liveAt}
          dateFmt={dateFmtLivegang}
          strings={{
            eyebrow: tLivegang("eyebrow"),
            headingPrefix: tLivegang("headingPrefix"),
            headingSuffix: tLivegang("headingSuffix"),
            body: tLivegang("body"),
            visitLabel: tLivegang("visit"),
            dismissLabel: tLivegang("dismiss"),
          }}
        />
      ))}

      <DashboardIntro
        greeting={greeting}
        firstName={firstName}
        status={status}
        subStatus={subStatus}
        rotatingMessages={rotatingMessages}
      />

      <StatusBanner
        healthy={healthy}
        message={healthy ? t("banner.healthy") : t("banner.issue")}
        cta={t("banner.viewStatus")}
      />

      {/* Delivery timeline — alleen wanneer er een actieve Build-fase is.
          Staat hoog op de pagina omdat het de meest concrete vraag van
          een klant beantwoordt: 'wanneer is mijn project klaar?'. */}
      {buildPhase && buildPhaseProps ? (
        <DeliveryCard
          phase={{
            extension: buildPhase.extension,
            startedAt: buildPhase.startedAt,
            endsAt: buildPhase.endsAt,
            durationMonths: buildPhase.durationMonths,
            label: buildPhase.label,
            project: buildPhase.project,
            pct: buildPhaseProps.pct,
            daysRemaining: buildPhaseProps.daysRemaining,
          }}
          strings={{
            title: t("dashboard.deliveryTitle"),
            extensionLabel: {
              light: t("dashboard.deliveryExtensionLight"),
              standard: t("dashboard.deliveryExtensionStandard"),
              custom: t("dashboard.deliveryExtensionCustom"),
            },
            monthsRemaining: t("dashboard.deliveryMonthsRemaining"),
            daysRemaining: t("dashboard.deliveryDaysRemaining"),
            overdueLabel: t("dashboard.deliveryOverdue"),
            started: t("dashboard.deliveryStarted"),
            ends: t("dashboard.deliveryEnds"),
            after: t("dashboard.deliveryAfter"),
            pctLabel: t("dashboard.deliveryPctLabel"),
          }}
        />
      ) : null}

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

      {/* Tier-aware widget rij — altijd Hours + Security, Atelier voegt
          Roadmap toe. Care/Studio krijgen 2 cards in lg:grid-cols-2,
          Atelier 3 in lg:grid-cols-3. */}
      <div className={`grid gap-5 ${showRoadmap ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <HoursWidget
          used={hours.minutesUsed}
          budget={budgetMinutes}
          recent={hours.recent.map((r) => ({
            id: r.id,
            description: r.description,
            minutes: r.minutes,
            workedOn: r.workedOn,
          }))}
          strings={{
            title: t("dashboard.hoursTitle"),
            monthLabel: t("dashboard.hoursMonth"),
            usedLabel: t("dashboard.hoursUsed"),
            budgetLabel: t("dashboard.hoursBudget"),
            recentTitle: t("dashboard.hoursRecentTitle"),
            empty: t("dashboard.hoursEmpty"),
            viewAll: t("dashboard.viewAll"),
          }}
        />
        <SecurityCard
          strings={{
            title: t("dashboard.securityTitle"),
            statusLabel: t("dashboard.securityStatus"),
            statusValue: t("dashboard.securityStatusValue"),
            backupLabel: t("dashboard.securityBackup"),
            backupValue: t("dashboard.securityBackupValue"),
            sslLabel: t("dashboard.securitySsl"),
            sslValue: t("dashboard.securitySslValue"),
            soonNote: t("dashboard.securitySoonNote"),
          }}
        />
        {showRoadmap ? (
          <RoadmapCard
            items={roadmapItems}
            strings={{
              title: t("dashboard.roadmapTitle"),
              shipped: t("dashboard.roadmapShipped"),
              active: t("dashboard.roadmapActive"),
              next: t("dashboard.roadmapNext"),
              empty: t("dashboard.roadmapEmpty"),
              viewAll: t("dashboard.roadmapViewAll"),
            }}
          />
        ) : null}
      </div>

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

      <div className={`grid gap-5 ${showSeoSparkline ? "lg:grid-cols-2" : ""}`}>
        {showSeoSparkline ? (
          <SeoSparkline
            title={t("dashboard.seoTitle")}
            subtitle={t("dashboard.seoSubtitle")}
            delta={t("dashboard.seoDelta")}
            viewLabel={t("dashboard.viewAll")}
          />
        ) : null}
        <Suspense fallback={<MonitoringCardSkeleton title={t("dashboard.monitoringTitle")} />}>
          <MonitoringCardAsync
            title={t("dashboard.monitoringTitle")}
            empty={t("dashboard.monitoringEmpty")}
            viewLabel={t("dashboard.viewAll")}
            statusLabels={monitorStatusLabels}
          />
        </Suspense>
      </div>

      <RecentInvoices
        invoices={invoices.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount: inv.amount,
          vatAmount: inv.vatAmount,
          currency: inv.currency,
          status: inv.status,
          createdAt: inv.createdAt,
        }))}
        title={t("dashboard.recentInvoices")}
        empty={t("dashboard.noInvoices")}
        viewAll={t("dashboard.viewAll")}
        locale={locale}
        statusLabel={(s: string) => tInvoices(`status.${s}`)}
      />
    </div>
  );
}
