import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Star } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getOrgFullView, getOrgHoursThisMonth } from "@/lib/db/queries/admin";
import { getActiveBuildPhase } from "@/lib/db/queries/portal";
import { getActiveStripeSubscription } from "@/lib/stripe";
import {
  updateProject,
  logHours,
  updateOrg,
  createProject,
  createBuildPhase,
  changePlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  grantDiscount,
  toggleVip,
} from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { OrgDetailTabs, type TabKey } from "@/components/admin/OrgDetailTabs";
import { OrgQuickActions } from "@/components/admin/OrgQuickActions";
import { SubscriptionTab } from "@/components/admin/SubscriptionTab";
import { budgetMinutesFor } from "@/lib/plan-budget";

export default async function OrgDetail({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const fullView = await getOrgFullView(orgId);
  if (!fullView) notFound();
  const { org, latestSub, recentDiscounts, recentAuditEvents } = fullView;

  const [hours, activeBuild] = await Promise.all([
    getOrgHoursThisMonth(orgId),
    getActiveBuildPhase(orgId),
  ]);
  const budgetMinutes = budgetMinutesFor(org.plan);
  const usedMinutes = hours.minutesUsed;
  const usagePct =
    budgetMinutes > 0 ? Math.min(100, Math.round((usedMinutes / budgetMinutes) * 100)) : 0;

  // Live Stripe-state — best-effort. Falen mag niet de page breken.
  const stripeSub = org.stripeCustomerId
    ? await getActiveStripeSubscription(org.stripeCustomerId)
    : null;
  // Stripe verplaatste `current_period_end` van de subscription naar
  // het eerste item; we falle terug op de DB-row als beide leeg zijn.
  const stripePeriodEnd = stripeSub?.items.data[0]?.current_period_end ?? null;
  const subData = latestSub
    ? {
        plan: latestSub.plan,
        status: stripeSub?.status ?? latestSub.status,
        currentPeriodEnd: stripePeriodEnd
          ? new Date(stripePeriodEnd * 1000)
          : latestSub.currentPeriodEnd,
        cancelAt: stripeSub?.cancel_at ? new Date(stripeSub.cancel_at * 1000) : latestSub.cancelAt,
        stripeSubscriptionId: latestSub.stripeSubscriptionId,
        paused: Boolean(stripeSub?.pause_collection),
      }
    : null;

  const t = await getTranslations("admin.org");
  const tProjects = await getTranslations("portal.projects");
  const tSettings = await getTranslations("portal.settings");
  const tBuild = await getTranslations("pricing.build.options");
  const tQuick = await getTranslations("admin.quickActions");
  const tSub = await getTranslations("admin.subscription");
  const tTabs = await getTranslations("admin.orgTabs");

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const todayIso = new Date().toISOString().split("T")[0];

  // Bind alle org-scoped actions
  const logHoursAction = logHours.bind(null, orgId);
  const updateOrgAction = updateOrg.bind(null, orgId);
  const createProjectAction = createProject.bind(null, orgId);
  const createBuildPhaseAction = createBuildPhase.bind(null, orgId);
  const changePlanAction = changePlan.bind(null, orgId);
  const pauseAction = pauseSubscription.bind(null, orgId);
  const resumeAction = resumeSubscription.bind(null, orgId);
  const cancelAction = cancelSubscription.bind(null, orgId);
  const grantDiscountAction = grantDiscount.bind(null, orgId);
  const toggleVipAction = toggleVip.bind(null, orgId);

  const backHref = locale === "nl" ? "/admin/orgs" : `/${locale}/admin/orgs`;

  // Owner-email voor mail-quick-action
  const ownerEmail =
    org.members.find((m) => m.role === "owner")?.email ?? org.members[0]?.email ?? null;

  // === Tab panels ===
  const overviewPanel = (
    <div className="space-y-8">
      {/* Bedrijfsgegevens */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t("details")}</h2>
        <ToastForm
          action={updateOrgAction}
          className="grid gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 sm:grid-cols-2"
        >
          <label className="space-y-1">
            <span className="block text-xs font-medium">Naam</span>
            <input
              type="text"
              name="name"
              defaultValue={org.name}
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">Land</span>
            <select
              name="country"
              defaultValue={org.country}
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="NL">Nederland</option>
              <option value="ES">España</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">Tier</span>
            <select
              name="plan"
              defaultValue={org.plan ?? ""}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="">— geen tier —</option>
              <option value="care">Care · €95/m</option>
              <option value="studio">Studio · €179/m</option>
              <option value="atelier">Atelier · €399/m</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">BTW / NIF</span>
            <input
              type="text"
              name="vatNumber"
              defaultValue={org.vatNumber ?? ""}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <ToastSubmitButton variant="accent" size="md">
              {t("saveOrg")}
            </ToastSubmitButton>
          </div>
        </ToastForm>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t("members")}</h2>
        {org.members.length === 0 ? (
          <p className="text-sm text-(--color-muted)">—</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            {org.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name ?? m.email}</p>
                  <p className="truncate font-mono text-xs text-(--color-muted)">{m.email}</p>
                </div>
                <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
                  {tSettings(`roles.${m.role}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const subscriptionPanel = (
    <SubscriptionTab
      sub={subData}
      discounts={recentDiscounts}
      changePlan={changePlanAction}
      pause={pauseAction}
      resume={resumeAction}
      cancel={cancelAction}
      grantDiscount={grantDiscountAction}
      dateFmt={dateFmt}
      strings={{
        noSubscription: tSub("noSubscription"),
        noSubscriptionBody: tSub("noSubscriptionBody"),
        currentPlan: tSub("currentPlan"),
        status: tSub("status"),
        renewsAt: tSub("renewsAt"),
        cancelsAt: tSub("cancelsAt"),
        pausedLabel: tSub("pausedLabel"),
        changePlan: tSub("changePlan"),
        pauseTitle: tSub("pauseTitle"),
        pauseBody: tSub("pauseBody"),
        pause1: tSub("pause1"),
        pause2: tSub("pause2"),
        pause3: tSub("pause3"),
        resume: tSub("resume"),
        cancelTitle: tSub("cancelTitle"),
        cancelBody: tSub("cancelBody"),
        cancelButton: tSub("cancelButton"),
        cancelConfirm: tSub("cancelConfirm"),
        discountTitle: tSub("discountTitle"),
        discountBody: tSub("discountBody"),
        discountTrigger: tSub("discountTrigger"),
        discountPercent: tSub("discountPercent"),
        discountMonths: tSub("discountMonths"),
        discountForever: tSub("discountForever"),
        discountReason: tSub("discountReason"),
        discountReasonPlaceholder: tSub("discountReasonPlaceholder"),
        discountSubmit: tSub("discountSubmit"),
        discountCancel: tSub("discountCancel"),
        discountHistoryTitle: tSub("discountHistoryTitle"),
        discountHistoryEmpty: tSub("discountHistoryEmpty"),
        discountForeverLabel: tSub("discountForeverLabel"),
        discountMonthsLabel: tSub("discountMonthsLabel"),
      }}
    />
  );

  const projectsPanel = (
    <section className="space-y-4">
      <h2 className="text-xl font-medium">{t("projects")}</h2>
      {org.projects.length === 0 ? (
        <p className="text-sm text-(--color-muted)">{t("noProjects")}</p>
      ) : (
        <ul className="space-y-4">
          {org.projects.map((p) => {
            const updateAction = updateProject.bind(null, p.id);
            return (
              <li
                key={p.id}
                className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-medium">{p.name}</h3>
                  <span className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {tProjects(`type.${p.type}`)}
                  </span>
                </div>
                {p.monitoringTargetUrl ? (
                  <a
                    href={p.monitoringTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex font-mono text-[11px] tracking-wide text-(--color-accent) hover:underline"
                  >
                    {p.monitoringTargetUrl} ↗
                  </a>
                ) : null}
                <ToastForm
                  action={updateAction}
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end"
                >
                  <label className="space-y-1 sm:col-span-2">
                    <span className="block text-xs font-medium">{t("siteUrl")}</span>
                    <input
                      type="url"
                      name="url"
                      defaultValue={p.monitoringTargetUrl ?? ""}
                      placeholder={t("siteUrlPlaceholder")}
                      className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs font-medium">Status</span>
                    <select
                      name="status"
                      defaultValue={p.status}
                      className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                    >
                      <option value="planning">{tProjects("status.planning")}</option>
                      <option value="in_progress">{tProjects("status.in_progress")}</option>
                      <option value="review">{tProjects("status.review")}</option>
                      <option value="live">{tProjects("status.live")}</option>
                      <option value="done">{tProjects("status.done")}</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs font-medium">{t("progress")} %</span>
                    <input
                      type="number"
                      name="progress"
                      min={0}
                      max={100}
                      defaultValue={p.progress}
                      className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                    />
                  </label>
                  <ToastSubmitButton variant="accent" size="md">
                    {t("saveProject")}
                  </ToastSubmitButton>
                </ToastForm>
              </li>
            );
          })}
        </ul>
      )}

      {/* Project toevoegen */}
      <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-6">
        <h3 className="mb-4 text-base font-medium">{t("addProject")}</h3>
        <ToastForm
          action={createProjectAction}
          className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1.5fr_auto] sm:items-end"
        >
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("newProjectName")}</span>
            <input
              type="text"
              name="name"
              placeholder={t("newProjectNamePlaceholder")}
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("newProjectType")}</span>
            <select
              name="type"
              defaultValue="system"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="website">{tProjects("type.website")}</option>
              <option value="webshop">{tProjects("type.webshop")}</option>
              <option value="system">{tProjects("type.system")}</option>
              <option value="build">{tProjects("type.build")}</option>
              <option value="care">{tProjects("type.care")}</option>
              <option value="seo">{tProjects("type.seo")}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("siteUrl")}</span>
            <input
              type="url"
              name="url"
              placeholder={t("siteUrlPlaceholder")}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <ToastSubmitButton variant="accent" size="md">
            {t("newProjectSubmit")}
          </ToastSubmitButton>
        </ToastForm>
      </div>

      {/* Build-phase */}
      <section className="space-y-4 pt-6">
        <h2 className="text-xl font-medium">{t("buildPhase")}</h2>
        {activeBuild ? (
          <div className="rounded-lg border border-(--color-accent)/40 bg-(--color-bg-warm) p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-base font-medium">{activeBuild.label}</p>
              <span className="rounded-full bg-(--color-accent) px-2.5 py-1 font-mono text-[10px] tracking-widest text-white uppercase">
                {tBuild(activeBuild.extension)}
              </span>
            </div>
            <p className="mt-2 font-mono text-xs text-(--color-muted)">
              {dateFmt.format(activeBuild.startedAt)} → {dateFmt.format(activeBuild.endsAt)} ·{" "}
              {activeBuild.durationMonths} mnd
              {activeBuild.project ? ` · ${activeBuild.project.name}` : ""}
            </p>
            <p className="mt-2 font-mono text-[11px] text-(--color-accent)">
              {t("buildEndsOn")} {dateFmt.format(activeBuild.endsAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-(--color-muted)">{t("noBuildPhase")}</p>
        )}

        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-6">
          <h3 className="mb-4 text-base font-medium">{t("addBuildPhase")}</h3>
          <ToastForm
            action={createBuildPhaseAction}
            className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1.4fr_1fr_120px_140px_auto]"
          >
            <label className="space-y-1 lg:col-span-1">
              <span className="block text-xs font-medium">{t("buildLabel")}</span>
              <input
                type="text"
                name="label"
                placeholder={t("buildLabelPlaceholder")}
                required
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("buildExtension")}</span>
              <select
                name="extension"
                defaultValue="standard"
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              >
                <option value="light">Light · +€199/m · 4u</option>
                <option value="standard">Standard · +€499/m · 10u</option>
                <option value="custom">Custom · +€899/m · 20u</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("buildDuration")}</span>
              <input
                type="number"
                name="durationMonths"
                min={1}
                max={12}
                defaultValue={4}
                required
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("buildStartedOn")}</span>
              <input
                type="date"
                name="startedOn"
                defaultValue={todayIso}
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              />
            </label>
            <ToastSubmitButton variant="accent" size="md">
              {t("buildSubmit")}
            </ToastSubmitButton>
            {org.projects.length > 0 ? (
              <label className="space-y-1 sm:col-span-2 lg:col-span-5">
                <span className="block text-xs font-medium">{t("buildLinkProject")}</span>
                <select
                  name="projectId"
                  defaultValue=""
                  className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                >
                  <option value="">— geen —</option>
                  {org.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </ToastForm>
        </div>
      </section>
    </section>
  );

  const hoursPanel = (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-medium">{t("hoursLog")}</h2>
        {budgetMinutes > 0 ? (
          <p className="font-mono text-xs text-(--color-muted)">
            {Math.round(usedMinutes / 60).toString()}u {usedMinutes % 60}m / {budgetMinutes / 60}u ·{" "}
            {usagePct}%
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <ToastForm
          action={logHoursAction}
          className="grid gap-3 sm:grid-cols-[120px_140px_1fr_auto] sm:items-end"
        >
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("hoursMinutes")}</span>
            <input
              type="number"
              name="minutes"
              min={1}
              max={480}
              step={5}
              defaultValue={30}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("hoursWorkedOn")}</span>
            <input
              type="date"
              name="workedOn"
              defaultValue={todayIso}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("hoursDescription")}</span>
            <input
              type="text"
              name="description"
              placeholder={t("hoursDescPlaceholder")}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              required
            />
          </label>
          <ToastSubmitButton variant="accent" size="md">
            {t("hoursSubmit")}
          </ToastSubmitButton>
        </ToastForm>
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("hoursRecent")}
        </h3>
        {hours.recent.length === 0 ? (
          <p className="text-sm text-(--color-muted)">{t("hoursNone")}</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            {hours.recent.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{entry.description}</p>
                  <p className="font-mono text-[11px] text-(--color-muted)">
                    {dateFmt.format(entry.workedOn)}
                    {entry.project ? ` · ${entry.project.name}` : ""}
                    {entry.loggedByUser
                      ? ` · ${entry.loggedByUser.name ?? entry.loggedByUser.email}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-(--color-accent)">
                  {entry.minutes}m
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const activityPanel = (
    <section className="space-y-4">
      <h2 className="text-xl font-medium">{tTabs("activity")}</h2>
      {recentAuditEvents.length === 0 ? (
        <p className="text-sm text-(--color-muted)">{tTabs("activityEmpty")}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {recentAuditEvents.map((ev) => (
            <li key={ev.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-(--color-text)">{ev.action}</p>
                <p className="font-mono text-[11px] text-(--color-muted)">
                  {ev.targetType ?? "—"}
                  {ev.targetId ? ` · ${ev.targetId.slice(0, 8)}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-[12px] text-(--color-muted)">
                {dateFmt.format(ev.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const tabs: Array<{ key: TabKey; label: string; count?: number; accent?: boolean }> = [
    { key: "overview", label: tTabs("overview") },
    { key: "subscription", label: tTabs("subscription") },
    { key: "projects", label: tTabs("projects"), count: org.projects.length },
    { key: "hours", label: tTabs("hours") },
    { key: "activity", label: tTabs("activity") },
  ];

  return (
    <div className="space-y-8">
      <NextLink
        href={backHref}
        className="font-mono text-xs tracking-widest text-(--color-muted) uppercase hover:text-(--color-accent)"
      >
        ← {t("back")}
      </NextLink>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl md:text-5xl">{org.name}</h1>
            {org.isVip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--color-wine)/10 px-2.5 py-1 text-[11px] font-medium text-(--color-wine)">
                <Star className="h-3 w-3" fill="currentColor" />
                VIP
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-mono text-xs text-(--color-muted)">
            {org.country} · {org.plan ?? "no plan"} · created {dateFmt.format(org.createdAt)}
          </p>
        </div>
        <OrgQuickActions
          orgName={org.name}
          ownerEmail={ownerEmail}
          stripeCustomerId={org.stripeCustomerId}
          isVip={org.isVip}
          toggleVipAction={toggleVipAction}
          strings={{
            mailLabel: tQuick("mail"),
            stripeLabel: tQuick("stripe"),
            vipLabel: tQuick("vip"),
            vipActive: tQuick("vipActive"),
          }}
        />
      </header>

      <OrgDetailTabs
        tabs={tabs}
        defaultTab="overview"
        panels={{
          overview: overviewPanel,
          subscription: subscriptionPanel,
          projects: projectsPanel,
          hours: hoursPanel,
          activity: activityPanel,
        }}
      />
    </div>
  );
}
