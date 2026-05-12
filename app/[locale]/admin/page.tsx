import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Building2, MessageSquare, FolderKanban, Receipt, Coins, Clock } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getStudioStats,
  getRecentAdminActivity,
  getRevenueStats,
  getCrossOrgHoursThisMonth,
  getStudioStatusStrip,
  getDemoFunnelStats,
  getDemoSnapshot,
  getUpcomingCalls,
  getStaleProjects,
  listLeadRemindersDueToday,
  countOpenConfiguratorLeads,
  countHighPriorityOpenTickets,
  getTicketsAwaitingStaffReply,
} from "@/lib/db/queries/admin";
import { triggerDemoRefresh } from "@/app/actions/admin-bulk";
import { DemoManagementCard } from "@/components/admin/DemoManagementCard";
import { UpcomingCallsWidget } from "@/components/admin/UpcomingCallsWidget";
import { StaleProjectsWidget } from "@/components/admin/StaleProjectsWidget";
import { LeadRemindersWidget } from "@/components/admin/LeadRemindersWidget";
import { StatCard } from "@/components/portal/StatCard";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { FlashCounter } from "@/components/animate/FlashCounter";
import { AdminWelcomeOnboarding } from "@/components/admin/AdminWelcomeOnboarding";
import { StudioStatusStrip } from "@/components/admin/StudioStatusStrip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SetupChecklist } from "@/components/admin/SetupChecklist";
import { DemoTourOverlay } from "@/components/demo/DemoTourOverlay";
import { DemoAnalyticsBeacon } from "@/components/demo/DemoAnalyticsBeacon";

/**
 * Voegt een berekend `overdue` flag toe aan elke reminder-row. Date.now()
 * staat buiten render zodat de react-hooks/purity-rule niet aanslaat.
 */
function withOverdueFlag<T extends { nextActionAt: Date | null }>(
  rows: T[],
): Array<T & { overdue: boolean }> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return rows.map((r) => ({
    ...r,
    overdue: r.nextActionAt !== null && r.nextActionAt.getTime() < cutoff,
  }));
}

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tOnboarding = await getTranslations("admin.onboarding");
  const tStrip = await getTranslations("admin.statusStrip");
  const tTour = await getTranslations("demo.tour.admin");
  const [
    stats,
    events,
    revenue,
    crossOrgMinutes,
    statusStrip,
    demoFunnel,
    demoSnapshot,
    upcomingCalls,
    staleProjects,
    leadReminders,
    openConfiguratorLeads,
    highPriorityTickets,
    awaitingReply,
  ] = await Promise.all([
    getStudioStats(),
    getRecentAdminActivity(8),
    getRevenueStats(),
    getCrossOrgHoursThisMonth(),
    getStudioStatusStrip(),
    getDemoFunnelStats(7),
    getDemoSnapshot(),
    getUpcomingCalls(5),
    getStaleProjects(7),
    listLeadRemindersDueToday(),
    countOpenConfiguratorLeads(),
    countHighPriorityOpenTickets(),
    getTicketsAwaitingStaffReply(6),
  ]);
  const tDemo = await getTranslations("admin.demoFunnel");
  const tDemoMgmt = await getTranslations("admin.demoManagement");

  // Eerste-keer detectie: lastLoginAt wordt door het signIn-event in
  // lib/auth.ts pas ná de session-cookie gezet — bij allereerste paint
  // van /admin staat 'ie nog op null. Toont de onboarding-card. Ook als
  // lastLoginAt strict ouder is dan createdAt (kan voorkomen als
  // promote pas later gebeurde) tonen we 'm; dat is een pure
  // timestamp-vergelijking, geen Date.now() in render.
  const session = await auth();
  let isFirstTimeStaff = false;
  let isDemoStaff = false;
  let firstName = "";
  if (session?.user?.id) {
    const me = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        name: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
        isDemo: true,
      },
    });
    if (me) {
      isDemoStaff = me.isDemo;
      firstName =
        (me.name ?? "").split(" ")[0]?.trim() ||
        (me.email?.split("@")[0]?.trim() ?? "") ||
        "studio";
      const noPriorLogin = !me.lastLoginAt;
      const lastLoginEqualsCreate = Boolean(
        me.lastLoginAt &&
        me.createdAt &&
        me.lastLoginAt.getTime() <= me.createdAt.getTime() + 60 * 1000,
      );
      isFirstTimeStaff = noPriorLogin || lastLoginEqualsCreate;
    }
  }

  const totalActiveOrgs =
    revenue.distribution.care + revenue.distribution.studio + revenue.distribution.atelier;
  const hoursDisplay = `${(crossOrgMinutes / 60).toFixed(1)}u`;
  const eurFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-10">
      {isDemoStaff ? <DemoAnalyticsBeacon kind="entered" role="admin" /> : null}
      {isDemoStaff ? (
        <DemoTourOverlay
          role="admin"
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
      {isFirstTimeStaff && !isDemoStaff ? (
        <AdminWelcomeOnboarding
          firstName={firstName}
          orgsCount={Number(stats.orgs)}
          openTicketsCount={Number(stats.openTickets)}
          strings={{
            step1Title: tOnboarding("step1Title"),
            step1Body: tOnboarding("step1Body"),
            step2Title: tOnboarding("step2Title"),
            step2Cta: tOnboarding("step2Cta"),
            step3Title: tOnboarding("step3Title"),
            step3Cta: tOnboarding("step3Cta"),
            next: tOnboarding("next"),
            dismiss: tOnboarding("dismiss"),
            step: tOnboarding.raw("step") as string,
          }}
        />
      ) : null}

      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Operationele stats — FlashCounter voor de getallen, knipoog
          bij elke fresh paint. Honoreert prefers-reduced-motion intern. */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.orgs")}
          value={<FlashCounter to={Number(stats.orgs)} />}
          icon={Building2}
        />
        <StatCard
          label={t("stats.openTickets")}
          value={<FlashCounter to={Number(stats.openTickets)} />}
          icon={MessageSquare}
          accent={Number(stats.openTickets) > 0}
        />
        <StatCard
          label={t("stats.activeProjects")}
          value={<FlashCounter to={Number(stats.activeProjects)} />}
          icon={FolderKanban}
        />
        <StatCard
          label={t("stats.openInvoices")}
          value={<FlashCounter to={Number(stats.openInvoices)} />}
          icon={Receipt}
          accent={Number(stats.openInvoices) > 0}
        />
      </section>

      {/* "Vandaag"-zone — alleen wat er echt is. Lege sub-blokken vallen weg;
          is er niks dringend, dan een korte rustgevende regel i.p.v. drie lege
          kaders. Pills rechts: open configurator-aanvragen + high-priority tickets. */}
      {(() => {
        const nothingUrgent =
          leadReminders.length === 0 &&
          upcomingCalls.length === 0 &&
          staleProjects.length === 0 &&
          awaitingReply.length === 0;
        const adminBase = `/${locale === "nl" ? "" : `${locale}/`}admin`;
        const ticketHref = (tid: string) => `${adminBase}/tickets/${tid}`;
        const dateFmtShort = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
        return (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-muted) uppercase">
                {"// "}
                {t("todayEyebrow")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {highPriorityTickets > 0 ? (
                  <a
                    href={`${adminBase}/tickets`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-(--color-wine)/10 px-3 py-1 font-mono text-[10px] tracking-wide text-(--color-wine) uppercase transition-colors hover:bg-(--color-wine)/20"
                  >
                    {highPriorityTickets} high-priority{" "}
                    {highPriorityTickets === 1 ? "ticket" : "tickets"}
                  </a>
                ) : null}
                {openConfiguratorLeads > 0 ? (
                  <a
                    href={`${adminBase}/leads`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent)/10 px-3 py-1 font-mono text-[10px] tracking-wide text-(--color-wine) uppercase transition-colors hover:bg-(--color-accent)/20"
                  >
                    {openConfiguratorLeads}{" "}
                    {openConfiguratorLeads === 1
                      ? "configurator-aanvraag"
                      : "configurator-aanvragen"}
                  </a>
                ) : null}
              </div>
            </div>
            {nothingUrgent ? (
              <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/40 px-5 py-4 text-[14px] text-(--color-muted)">
                Niks dringend — geen openstaande follow-ups, calls, stale projecten of
                klant-reacties. Fijne dag.
              </p>
            ) : (
              <>
                {/* Klant heeft net gereageerd — de bal ligt bij jou */}
                {awaitingReply.length > 0 ? (
                  <article className="overflow-hidden rounded-lg border border-t-2 border-(--color-border) border-t-(--color-accent) bg-(--color-surface)">
                    <header className="border-b border-(--color-border) px-5 py-3">
                      <h2 className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                        {"// klant heeft gereageerd"}
                      </h2>
                    </header>
                    <ul className="divide-y divide-(--color-border)">
                      {awaitingReply.map((r) => (
                        <li key={r.id}>
                          <a
                            href={ticketHref(r.id)}
                            className="block px-5 py-3 transition-colors hover:bg-(--color-bg-warm)/40"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-[14px] font-medium text-(--color-text)">
                                {r.subject}
                              </p>
                              <p className="font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                                {r.orgName ?? "—"} · {dateFmtShort.format(r.lastReplyAt)}
                              </p>
                            </div>
                            <p className="mt-1 truncate text-[13px] text-(--color-muted)">
                              {r.replyExcerpt}
                            </p>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ) : null}
                {leadReminders.length > 0 ? (
                  <LeadRemindersWidget reminders={withOverdueFlag(leadReminders)} />
                ) : null}
                {upcomingCalls.length > 0 || staleProjects.length > 0 ? (
                  <div
                    className={`grid gap-4 ${
                      upcomingCalls.length > 0 && staleProjects.length > 0 ? "md:grid-cols-2" : ""
                    }`}
                  >
                    {upcomingCalls.length > 0 ? (
                      <UpcomingCallsWidget calls={upcomingCalls} locale={locale} />
                    ) : null}
                    {staleProjects.length > 0 ? (
                      <StaleProjectsWidget projects={staleProjects} locale={locale} />
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>
        );
      })()}

      {/* Setup-checklist — éénmalige "nog regelen"-items (API-keys, webhooks,
          Search Console…). Verdwijnt zodra alles is afgevinkt. Niet voor demo-staff. */}
      {!isDemoStaff ? <SetupChecklist /> : null}

      {/* Demo-management — laatste cron-run + week-counts + handmatige
          refresh-knop. Niet-demo-staff alleen (anders triggert demo-staff
          z'n eigen refresh, wat onnodig confronterend is). */}
      {!isDemoStaff ? (
        <DemoManagementCard
          hasDemoOrg={demoSnapshot.hasDemoOrg}
          lastRunAt={demoSnapshot.lastRunAt}
          weeklyEntered={demoSnapshot.weeklyEntered}
          weeklyCtaClicks={demoSnapshot.weeklyCtaClicks}
          refreshAction={triggerDemoRefresh}
          strings={{
            eyebrow: tDemoMgmt("eyebrow"),
            title: tDemoMgmt("title"),
            body: tDemoMgmt("body"),
            metric: {
              lastRun: tDemoMgmt("metric.lastRun"),
              entered: tDemoMgmt("metric.entered"),
              ctaClicks: tDemoMgmt("metric.ctaClicks"),
            },
            refreshAction: tDemoMgmt("refreshAction"),
            refreshing: tDemoMgmt("refreshing"),
            refreshed: tDemoMgmt("refreshed"),
            refreshError: tDemoMgmt("refreshError"),
            notSeeded: tDemoMgmt("notSeeded"),
            notSeededHint: tDemoMgmt("notSeededHint"),
          }}
        />
      ) : null}

      {/* Demo-funnel — bezoeken + cta-clicks + conversion-% over 7d */}
      {demoFunnel.entered > 0 ? (
        <article className="rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-5">
          <header className="flex items-center justify-between border-b border-(--color-border) pb-3">
            <h2 className="text-[14px] font-medium">{tDemo("title")}</h2>
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {tDemo("window", { days: demoFunnel.days })}
            </span>
          </header>
          <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {tDemo("entered")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                <FlashCounter to={demoFunnel.entered} />
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {tDemo("ctaClicks")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none text-(--color-wine)">
                <FlashCounter to={demoFunnel.ctaClicks} />
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {tDemo("conversion")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                <FlashCounter to={demoFunnel.conversion} suffix="%" />
              </p>
            </div>
          </div>
        </article>
      ) : null}

      {/* Studio status-strip — wijn-rode dot per org-met-down, accent
          per degraded, success per up. Bij hover: org-naam. */}
      <StudioStatusStrip
        items={statusStrip}
        strings={{
          title: tStrip("title"),
          legendUp: tStrip("legendUp"),
          legendDegraded: tStrip("legendDegraded"),
          legendDown: tStrip("legendDown"),
          legendUnknown: tStrip("legendUnknown"),
          empty: tStrip("empty"),
        }}
      />

      {/* Revenue + uren — studio-level overzicht */}
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
          <header className="flex items-center justify-between border-b border-(--color-border) pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
              <h2 className="text-base font-medium">{t("revenue.title")}</h2>
            </div>
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {totalActiveOrgs} {t("revenue.activeOrgs")}
            </span>
          </header>
          <div className="grid grid-cols-2 gap-6 pt-5 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {t("revenue.mrr")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                {eurFmt.format(revenue.mrr)}
              </p>
              <p className="mt-1 font-mono text-[10px] text-(--color-muted)">/m</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {t("revenue.arr")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                {eurFmt.format(revenue.arr)}
              </p>
              <p className="mt-1 font-mono text-[10px] text-(--color-muted)">/y</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                Care
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                {revenue.distribution.care}
              </p>
              <p className="mt-1 font-mono text-[10px] text-(--color-muted)">€95/m</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                Studio · Atelier
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none">
                {revenue.distribution.studio + revenue.distribution.atelier}
              </p>
              <p className="mt-1 font-mono text-[10px] text-(--color-muted)">
                €179 + €399 ·{" "}
                {revenue.distribution.atelier > 0 ? `${revenue.distribution.atelier} A` : "0 A"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
          <header className="flex items-center justify-between border-b border-(--color-border) pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-(--color-success)" strokeWidth={2} />
              <h2 className="text-base font-medium">{t("revenue.hoursTitle")}</h2>
            </div>
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {t("revenue.thisMonth")}
            </span>
          </header>
          <p className="mt-5 font-serif text-[40px] leading-none">{hoursDisplay}</p>
          <p className="mt-2 text-[13px] text-(--color-muted)">{t("revenue.hoursLede")}</p>
        </article>
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
