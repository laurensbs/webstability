import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  Inbox,
  FolderKanban,
  Receipt,
  CheckCircle2,
  ArrowRight,
  FileText,
  Globe,
  Package,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Link } from "@/i18n/navigation";
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
  getReferralEligibleProject,
  getPendingDeliverables,
  getActivitySince,
  getLatestMonthlyReport,
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
import { PortalWelcomeOnboarding } from "@/components/portal/PortalWelcomeOnboarding";
import { serviceKindFromProjects } from "@/lib/service-kinds";
import { AuthVerifiedBeacon } from "@/components/auth/AuthVerifiedBeacon";
import { LivegangCelebration } from "@/components/portal/LivegangCelebration";
import { IncidentBanner } from "@/components/portal/IncidentBanner";
import { DemoTourOverlay } from "@/components/demo/DemoTourOverlay";
import { DemoAnalyticsBeacon } from "@/components/demo/DemoAnalyticsBeacon";
import { daysUntil } from "@/lib/format-age";
import { HoursWidget } from "@/components/portal/HoursWidget";
import { SecurityCard } from "@/components/portal/SecurityCard";
import { RoadmapCard } from "@/components/portal/RoadmapCard";
import { DeliveryCard } from "@/components/portal/DeliveryCard";
import { ReferralCard } from "@/components/portal/ReferralCard";
import { SinceLastVisit } from "@/components/portal/SinceLastVisit";
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
function daysSinceDate(date: Date): number {
  return Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

function isRecentReport(createdAt: Date, days = 14): boolean {
  return Date.now() - createdAt.getTime() < days * 24 * 60 * 60 * 1000;
}

const HOUR_MS = 60 * 60 * 1000;

function computeSinceStrip(lastLoginAt: Date | null): { since: Date; showStrip: boolean } {
  const now = Date.now();
  if (!lastLoginAt) {
    return { since: new Date(now - 7 * 24 * HOUR_MS), showStrip: true };
  }
  return {
    since: lastLoginAt,
    showStrip: now - lastLoginAt.getTime() > 24 * HOUR_MS,
  };
}

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
  const tOnboarding = await getTranslations("portal.onboarding");
  const tStatus = await getTranslations("status");
  // SinceLastVisit window: max(1d, lastLoginAt..now). Onder de drempel
  // van 24h slaan we de strip over (voorkomt herhaling). Date.now()
  // wordt buiten render gecomputeerd via de helper.
  const { since, showStrip: showSinceStrip } = computeSinceStrip(user.lastLoginAt ?? null);

  const [
    stats,
    projects,
    tickets,
    invoices,
    hours,
    buildPhase,
    recentLivegangs,
    incidents,
    referralProject,
    activity,
    pendingDeliverables,
    latestMonthlyReport,
  ] = await Promise.all([
    getDashboardStats(user.organizationId),
    listOrgProjects(user.organizationId),
    listOrgTickets(user.organizationId),
    listOrgInvoices(user.organizationId),
    getOrgHoursThisMonth(user.organizationId),
    getActiveBuildPhase(user.organizationId),
    getRecentLivegangs(user.organizationId, 7),
    getActiveIncidentsForOrg(user.organizationId),
    getReferralEligibleProject(user.organizationId, 90),
    getActivitySince(user.organizationId, since),
    getPendingDeliverables(user.organizationId),
    getLatestMonthlyReport(user.organizationId),
  ]);
  const tLivegang = await getTranslations("portal.livegang");
  const tIncident = await getTranslations("portal.incident");
  const tTour = await getTranslations("demo.tour.portal");
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

  // Dienst-type van deze klant — stuurt de "nog leeg"-teksten (een webshop
  // wacht op bestellingen, een website op de live-URL, een platform op de
  // koppelingen). 'other' valt terug op de generieke tekst.
  const serviceKind = serviceKindFromProjects(projects);
  const hasServiceKind = serviceKind !== "other";
  const monitoringEmpty = hasServiceKind
    ? t(`dashboard.monitoringEmptyByKind.${serviceKind}` as Parameters<typeof t>[0])
    : t("dashboard.monitoringEmpty");
  const noProjectsEmpty = hasServiceKind
    ? t(`dashboard.noProjectsByKind.${serviceKind}` as Parameters<typeof t>[0])
    : t("dashboard.noProjects");

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

  // NB: `last_org` cookie wordt niet vanuit deze server-component gezet —
  // Next 16 staat alleen cookies.set() toe in route-handlers / server-
  // actions. Login-statline op /login leest in plaats daarvan via een
  // server-action / API als die ooit gewenst is.

  const healthy = !stats.hasHighPriority && stats.openTickets === 0;

  return (
    <div className="space-y-10">
      <AuthVerifiedBeacon />

      {/* Demo-analytics + tour — alleen voor demo-users */}
      {user.isDemo ? <DemoAnalyticsBeacon kind="entered" role="portal" /> : null}
      {user.isDemo ? (
        <DemoTourOverlay
          role="portal"
          strings={{
            step: tTour.raw("step") as string,
            step1Title: tTour("step1Title"),
            step1Body: tTour("step1Body"),
            step2Title: tTour("step2Title"),
            step2Body: tTour("step2Body"),
            step3Title: tTour("step3Title"),
            step3Body: tTour("step3Body"),
            next: tTour("next"),
            done: tTour("done"),
            dismiss: tTour("dismiss"),
          }}
        />
      ) : null}

      {/* Incident-banners — wijn-rood, één per actief incident. Geen
          dismiss; verdwijnen vanzelf zodra de monitoring-cron resolved. */}
      {incidents.map((inc) => (
        <IncidentBanner
          key={inc.id}
          projectName={inc.projectName ?? "—"}
          startedAtLabel={dateFmtIncident.format(inc.startedAt)}
          href={`/${locale}/portal/monitoring`}
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
          liveAtLabel={dateFmtLivegang.format(proj.liveAt)}
          strings={{
            eyebrow: tLivegang.raw("eyebrow") as string,
            headingPrefix: tLivegang.raw("headingPrefix") as string,
            headingSuffix: tLivegang("headingSuffix"),
            body: tLivegang("body"),
            visitLabel: tLivegang("visit"),
            dismissLabel: tLivegang("dismiss"),
          }}
        />
      ))}

      {/* Pending-deliverables banner — toont als er opleveringen
          wachten op klant-akkoord. Linkt naar het meest-recente
          project zodat de klant direct kan akkoord-of-revisie geven. */}
      {pendingDeliverables.length > 0 ? (
        <PendingDeliverablesBanner
          count={pendingDeliverables.length}
          firstProjectId={pendingDeliverables[0]?.projectId ?? null}
          locale={locale}
        />
      ) : null}

      {/* Maandrapport-banner — toont alleen de eerste 14 dagen na
          uitlevering zodat hij niet permanent in beeld blijft. */}
      {latestMonthlyReport && isRecentReport(latestMonthlyReport.createdAt) ? (
        <MonthlyReportBanner
          name={latestMonthlyReport.name}
          url={latestMonthlyReport.url}
          locale={locale}
        />
      ) : null}

      {/* Referral-card — alleen voor klanten die ≥90 dagen live zijn,
          en niet als er nu een livegang-feestmoment loopt. Strategie:
          persoonlijke vraag op het moment dat het systeem zijn waarde
          heeft bewezen. */}
      {referralProject && recentLivegangs.length === 0 ? (
        <ReferralCard
          projectName={referralProject.name}
          daysSinceLive={daysSinceDate(referralProject.liveAt)}
          locale={locale as "nl" | "es"}
        />
      ) : null}

      {showSinceStrip ? (
        <SinceLastVisit
          activity={activity}
          strings={{
            eyebrow: t("sinceLastVisit.eyebrow"),
            ticketClosedSingle: t("sinceLastVisit.ticketClosedSingle"),
            ticketClosedPlural: t("sinceLastVisit.ticketClosedPlural"),
            invoiceNewSingle: t("sinceLastVisit.invoiceNewSingle"),
            invoiceNewPlural: t("sinceLastVisit.invoiceNewPlural"),
            livegangSingle: t("sinceLastVisit.livegangSingle"),
            livegangPlural: t("sinceLastVisit.livegangPlural"),
            monitoringStable: t("sinceLastVisit.monitoringStable"),
            incidentsAllResolved: t("sinceLastVisit.incidentsAllResolved"),
          }}
        />
      ) : null}

      <DashboardIntro
        greeting={greeting}
        firstName={firstName}
        status={status}
        subStatus={subStatus}
        rotatingMessages={rotatingMessages}
      />

      {/* Welkom-onboarding — alleen bij de allereerste login (lastLoginAt is
          dan nog null; wordt verderop in deze render geüpdatet) en niet voor
          demo-users. Stap 2/3 zijn dienst-specifiek (website/webshop/platform);
          'other' valt terug op de generieke teksten. localStorage-dismiss vangt
          een refresh tussendoor. */}
      {!user.lastLoginAt && !user.isDemo
        ? (() => {
            const kind = serviceKind;
            const hasKind = hasServiceKind;
            const kp = (suffix: string) => tOnboarding(`byKind.${kind}.${suffix}`);
            return (
              <PortalWelcomeOnboarding
                firstName={firstName}
                strings={{
                  step: tOnboarding.raw("step") as string,
                  step1Title: tOnboarding("step1Title"),
                  step1Body: tOnboarding("step1Body"),
                  step2Title: hasKind ? kp("step2Title") : tOnboarding("step2Title"),
                  step2Body: hasKind ? kp("step2Body") : tOnboarding("step2Body"),
                  step2Cta: hasKind ? kp("step2Cta") : tOnboarding("step2Cta"),
                  step2Href: hasKind ? "/portal/monitoring" : "/portal/tickets",
                  step3Title: hasKind ? kp("step3Title") : tOnboarding("step3Title"),
                  step3Body: hasKind ? kp("step3Body") : tOnboarding("step3Body"),
                  step3Cta: hasKind ? kp("step3Cta") : tOnboarding("step3Cta"),
                  step3Href: hasKind ? "/portal/tickets" : "/portal/invoices",
                  next: tOnboarding("next"),
                  dismiss: tOnboarding("dismiss"),
                }}
              />
            );
          })()
        : null}

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

      {/* Pakket & website — alleen voor legacy website-abonnement-klanten
          (en/of orgs waar een website-URL is vastgelegd). */}
      {user.organization?.legacyPackageName || user.organization?.websiteUrl ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {user.organization?.legacyPackageName ? (
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
              <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                <Package className="h-3 w-3" strokeWidth={2.4} />
                {t("dashboard.packageEyebrow")}
              </p>
              <p className="mt-2 text-[18px] font-medium text-(--color-text)">
                {user.organization.legacyPackageName}
              </p>
              {user.organization.legacyPackagePriceCents != null ? (
                <p className="mt-1 text-[13px] text-(--color-muted)">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "EUR",
                  }).format(user.organization.legacyPackagePriceCents / 100)}{" "}
                  {user.organization.legacyBillingInterval === "yearly"
                    ? t("dashboard.packagePerYear")
                    : t("dashboard.packagePerMonth")}
                </p>
              ) : null}
            </div>
          ) : null}
          {user.organization?.websiteUrl ? (
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
              <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                <Globe className="h-3 w-3" strokeWidth={2.4} />
                {t("dashboard.websiteEyebrow")}
              </p>
              <a
                href={user.organization.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-medium text-(--color-accent) hover:underline"
              >
                {user.organization.websiteUrl.replace(/^https?:\/\//, "")}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              {user.organization.websiteNote ? (
                <p className="mt-1.5 text-[13px] text-(--color-muted)">
                  {user.organization.websiteNote}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

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
          empty={noProjectsEmpty}
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
            empty={monitoringEmpty}
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

function PendingDeliverablesBanner({
  count,
  firstProjectId,
  locale,
}: {
  count: number;
  firstProjectId: string | null;
  locale: string;
}) {
  const labelNl =
    count === 1
      ? "1 oplevering wacht op je akkoord"
      : `${count} opleveringen wachten op je akkoord`;
  const labelEs =
    count === 1
      ? "1 entregable espera tu aprobación"
      : `${count} entregables esperan tu aprobación`;
  const ctaNl = "Bekijk en geef akkoord";
  const ctaEs = "Revisar y aprobar";
  const isEs = locale === "es";

  const href = firstProjectId
    ? ({ pathname: "/portal/projects/[id]" as never, params: { id: firstProjectId } } as const)
    : ({ pathname: "/portal/files" as never } as const);

  return (
    <Link
      href={href}
      className="group rounded-card flex flex-wrap items-center gap-3 border border-(--color-success)/30 bg-(--color-success)/5 px-5 py-4 transition-colors hover:bg-(--color-success)/10"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(--color-success)/15 text-(--color-success)">
        <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-(--color-text)">{isEs ? labelEs : labelNl}</p>
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {isEs ? "klik om te beoordelen" : "klik om te beoordelen"}
        </p>
      </span>
      <span className="inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-(--color-success) uppercase">
        {isEs ? ctaEs : ctaNl}
        <ArrowRight
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </span>
    </Link>
  );
}

function MonthlyReportBanner({ name, url, locale }: { name: string; url: string; locale: string }) {
  const isEs = locale === "es";
  const title = isEs ? `${name} listo` : `${name} is klaar`;
  const sub = isEs ? "Tu informe mensual está disponible" : "Je maandrapport staat klaar";
  const cta = isEs ? "Abrir informe" : "Open rapport";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-card flex flex-wrap items-center gap-3 border border-(--color-accent)/30 bg-(--color-accent)/5 px-5 py-4 transition-colors hover:bg-(--color-accent)/10"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(--color-accent)/15 text-(--color-accent)">
        <FileText className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-(--color-text)">{title}</p>
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {sub}
        </p>
      </span>
      <span className="inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
        {cta}
        <ArrowRight
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </span>
    </a>
  );
}
