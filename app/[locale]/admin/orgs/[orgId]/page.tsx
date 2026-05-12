import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Star } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getOrgFullView,
  getOrgHoursThisMonth,
  getOrgFilesAndInvoices,
  getLinkedLeadForOrg,
} from "@/lib/db/queries/admin";
import { getActiveBuildPhase } from "@/lib/db/queries/portal";
import { getActiveStripeSubscription } from "@/lib/stripe";
import { dateInDays } from "@/lib/format-age";
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
  updateOrgPackage,
  linkStripeSubscription,
  uploadInvoicePdf,
  uploadOrgFile,
} from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { OrgDetailTabs, type TabKey } from "@/components/admin/OrgDetailTabs";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrgQuickActions } from "@/components/admin/OrgQuickActions";
import { SubscriptionTab } from "@/components/admin/SubscriptionTab";
import { budgetMinutesFor } from "@/lib/plan-budget";

// TODO (geplande refactor — C.1): deze page bouwt alle 6 tab-panels server-side
// op (overview/subscription/projects/files/hours/activity) en geeft ze door aan
// OrgDetailTabs, dat alleen de actieve toont. Beter: per-tab route-segmenten
// (/admin/orgs/[orgId]/subscription, …) of @parallel-slots, zodat elk tab z'n
// eigen data-fetch + <Suspense> heeft en het wisselen niet alles tegelijk laadt.
// Bewust nog niet gedaan — het is een grotere migratie van een billing-kritieke
// pagina, geen ad-hoc edit.
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

  const [hours, activeBuild, filesAndInvoices, linkedLead] = await Promise.all([
    getOrgHoursThisMonth(orgId),
    getActiveBuildPhase(orgId),
    getOrgFilesAndInvoices(orgId),
    getLinkedLeadForOrg(orgId),
  ]);
  const { orgFiles, orgInvoices } = filesAndInvoices;
  const budgetMinutes = budgetMinutesFor(org.plan);
  const usedMinutes = hours.minutesUsed;
  const usagePct =
    budgetMinutes > 0 ? Math.min(100, Math.round((usedMinutes / budgetMinutes) * 100)) : 0;

  // Live Stripe-state — best-effort. Falen mag niet de page breken.
  // Voor demo-orgs slaan we Stripe over en bouwen we een gefingeerde
  // subData zodat de tab niet "geen abonnement" toont. Demo-acties
  // zijn al guarded in P1 (DemoReadonlyError) — knoppen blijven
  // klikbaar en tonen toast.
  const stripeSub =
    org.stripeCustomerId && !org.isDemo
      ? await getActiveStripeSubscription(org.stripeCustomerId)
      : null;
  // Stripe verplaatste `current_period_end` van de subscription naar
  // het eerste item; we falle terug op de DB-row als beide leeg zijn.
  const stripePeriodEnd = stripeSub?.items.data[0]?.current_period_end ?? null;
  const subData = org.isDemo
    ? {
        // Faux subscription zodat SubscriptionTab vol oogt voor demo.
        plan: "studio" as const,
        status: "active",
        currentPeriodEnd: dateInDays(23),
        cancelAt: null,
        stripeSubscriptionId: "sub_demo_studio",
        paused: false,
      }
    : latestSub
      ? {
          plan: latestSub.plan,
          status: stripeSub?.status ?? latestSub.status,
          currentPeriodEnd: stripePeriodEnd
            ? new Date(stripePeriodEnd * 1000)
            : latestSub.currentPeriodEnd,
          cancelAt: stripeSub?.cancel_at
            ? new Date(stripeSub.cancel_at * 1000)
            : latestSub.cancelAt,
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
  const updateOrgPackageAction = updateOrgPackage.bind(null, orgId);
  const linkStripeAction = linkStripeSubscription.bind(null, orgId);
  const uploadInvoicePdfAction = uploadInvoicePdf.bind(null, orgId);
  const uploadOrgFileAction = uploadOrgFile.bind(null, orgId);

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
            <span className="block text-xs font-medium">{t("nameLabel")}</span>
            <input
              type="text"
              name="name"
              defaultValue={org.name}
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("countryLabel")}</span>
            <select
              name="country"
              defaultValue={org.country}
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="NL">{t("countryNL")}</option>
              <option value="ES">{t("countryES")}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("tierLabel")}</span>
            <select
              name="plan"
              defaultValue={org.plan ?? ""}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="">{t("noTier")}</option>
              <option value="care">Care · €95/m</option>
              <option value="studio">Studio · €179/m</option>
              <option value="atelier">Atelier · €399/m</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("vatLabel")}</span>
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

      {/* Pakket & website (legacy website-abonnement-klanten) */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t("packageTitle")}</h2>
        <p className="max-w-prose text-sm text-(--color-muted)">{t("packageHint")}</p>
        <ToastForm
          action={updateOrgPackageAction}
          className="grid gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 sm:grid-cols-2"
        >
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("packageNameLabel")}</span>
            <input
              type="text"
              name="packageName"
              defaultValue={org.legacyPackageName ?? ""}
              placeholder="Website Onderhoud Basis"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("packagePriceLabel")}</span>
              <input
                type="text"
                inputMode="decimal"
                name="priceEur"
                defaultValue={
                  org.legacyPackagePriceCents != null
                    ? (org.legacyPackagePriceCents / 100).toFixed(2)
                    : ""
                }
                placeholder="49.00"
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("packageIntervalLabel")}</span>
              <select
                name="billingInterval"
                defaultValue={org.legacyBillingInterval ?? "monthly"}
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              >
                <option value="monthly">{t("intervalMonthly")}</option>
                <option value="yearly">{t("intervalYearly")}</option>
              </select>
            </label>
          </div>
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("websiteUrlLabel")}</span>
            <input
              type="url"
              name="websiteUrl"
              defaultValue={org.websiteUrl ?? ""}
              placeholder="https://klant.nl"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("websiteNoteLabel")}</span>
            <input
              type="text"
              name="websiteNote"
              defaultValue={org.websiteNote ?? ""}
              placeholder="WordPress + WooCommerce, 12 pagina's"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <ToastSubmitButton variant="accent" size="md">
              {t("savePackage")}
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
                  <p className="mt-0.5 font-mono text-[11px] text-(--color-muted)">
                    {m.lastLoginAt ? (
                      <>
                        {t("lastLoginPrefix")}{" "}
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(m.lastLoginAt)}
                      </>
                    ) : (
                      <span className="text-(--color-wine)">{t("neverLoggedIn")}</span>
                    )}
                  </p>
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
    <div className="space-y-8">
      <SubscriptionTab
        sub={subData}
        discounts={recentDiscounts}
        changePlan={changePlanAction}
        pause={pauseAction}
        resume={resumeAction}
        cancel={cancelAction}
        grantDiscount={grantDiscountAction}
        locale={locale}
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

      {/* Stripe-koppeling — bestaand customer/subscription-ID koppelen */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">{t("stripeLinkTitle")}</h2>
        <p className="max-w-prose text-sm text-(--color-muted)">{t("stripeLinkHint")}</p>
        <ToastForm
          action={linkStripeAction}
          className="grid gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 sm:grid-cols-2"
        >
          <label className="space-y-1">
            <span className="block text-xs font-medium">Stripe customer ID</span>
            <input
              type="text"
              name="stripeCustomerId"
              defaultValue={org.stripeCustomerId ?? ""}
              placeholder="cus_..."
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 font-mono text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">Stripe subscription ID</span>
            <input
              type="text"
              name="stripeSubscriptionId"
              defaultValue={subData?.stripeSubscriptionId ?? ""}
              placeholder="sub_..."
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 font-mono text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("stripeLinkPlanLabel")}</span>
            <select
              name="plan"
              defaultValue={subData?.plan ?? ""}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="">{t("noTier")}</option>
              <option value="care">Care</option>
              <option value="studio">Studio</option>
              <option value="atelier">Atelier</option>
            </select>
          </label>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <ToastSubmitButton variant="accent" size="md">
              {t("stripeLinkSave")}
            </ToastSubmitButton>
          </div>
        </ToastForm>
      </section>
    </div>
  );

  // === Files & facturen ===
  const fmtMoney = (cents: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: currency || "EUR" }).format(
      cents / 100,
    );

  const filesPanel = (
    <div className="space-y-10">
      {/* Factuur uploaden */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">{t("invoiceUploadTitle")}</h2>
        <p className="max-w-prose text-sm text-(--color-muted)">{t("invoiceUploadHint")}</p>
        <ToastForm
          action={uploadInvoicePdfAction}
          resetOnSuccess
          className="grid gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 sm:grid-cols-2"
        >
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">PDF</span>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              required
              className="w-full text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("invoiceNumberLabel")}</span>
            <input
              type="text"
              name="number"
              required
              placeholder="2026-001"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("invoiceDateLabel")}</span>
            <input
              type="date"
              name="invoiceDate"
              defaultValue={todayIso}
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("invoiceAmountLabel")}</span>
            <input
              type="text"
              inputMode="decimal"
              name="amountEur"
              required
              placeholder="59.29"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium">{t("invoiceVatLabel")}</span>
            <input
              type="text"
              inputMode="decimal"
              name="vatEur"
              placeholder="10.29"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("invoiceStatusLabel")}</span>
            <select
              name="status"
              defaultValue="sent"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="sent">{t("invoiceStatusSent")}</option>
              <option value="paid">{t("invoiceStatusPaid")}</option>
            </select>
          </label>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <ToastSubmitButton variant="accent" size="md">
              {t("invoiceUploadButton")}
            </ToastSubmitButton>
          </div>
        </ToastForm>
      </section>

      {/* Facturen-lijst */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">{t("invoicesListTitle")}</h2>
        {orgInvoices.length === 0 ? (
          <p className="text-sm text-(--color-muted)">{t("invoicesEmpty")}</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            {orgInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.number}</p>
                  <p className="truncate font-mono text-xs text-(--color-muted)">
                    {fmtMoney(inv.amount, inv.currency)} · {inv.status}
                    {inv.stripeInvoiceId ? " · Stripe" : ""} · {dateFmt.format(inv.createdAt)}
                  </p>
                </div>
                {inv.pdfUrl ? (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase hover:underline"
                  >
                    PDF ↗
                  </a>
                ) : (
                  <span className="shrink-0 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {t("noPdf")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bestand uploaden */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">{t("fileUploadTitle")}</h2>
        <p className="max-w-prose text-sm text-(--color-muted)">{t("fileUploadHint")}</p>
        <ToastForm
          action={uploadOrgFileAction}
          resetOnSuccess
          className="grid gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 sm:grid-cols-2"
        >
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("fileLabel")}</span>
            <input type="file" name="file" required className="w-full text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium">{t("fileCategoryLabel")}</span>
            <select
              name="category"
              defaultValue="deliverable"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="deliverable">deliverable</option>
              <option value="contract">contract</option>
              <option value="report">report</option>
              <option value="asset">asset</option>
              <option value="brand_kit">brand_kit</option>
              <option value="copy">copy</option>
              <option value="screenshot">screenshot</option>
              <option value="wireframe">wireframe</option>
              <option value="final_handover">final_handover</option>
            </select>
          </label>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <ToastSubmitButton variant="accent" size="md">
              {t("fileUploadButton")}
            </ToastSubmitButton>
          </div>
        </ToastForm>
      </section>

      {/* Bestanden-lijst */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">{t("filesListTitle")}</h2>
        {orgFiles.length === 0 ? (
          <p className="text-sm text-(--color-muted)">{t("filesEmpty")}</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            {orgFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="truncate font-mono text-xs text-(--color-muted)">
                    {f.category} · {dateFmt.format(f.createdAt)}
                  </p>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase hover:underline"
                >
                  ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
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
                    <span className="block text-xs font-medium">{t("statusLabel")}</span>
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
                  <option value="">—</option>
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
    {
      key: "files",
      label: tTabs("filesInvoices"),
      count: orgFiles.length + orgInvoices.length,
    },
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

      <AdminPageHeader
        title={
          <span className="inline-flex flex-wrap items-baseline gap-3">
            {org.name}
            {org.isVip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--color-wine)/10 px-2.5 py-1 align-middle text-[11px] font-medium text-(--color-wine)">
                <Star className="h-3 w-3" fill="currentColor" />
                VIP
              </span>
            ) : null}
          </span>
        }
        subtitle={
          <>
            {org.country} · {org.plan ?? "no plan"} · created {dateFmt.format(org.createdAt)}
            {linkedLead ? (
              <>
                {" — "}
                <NextLink
                  href={`/admin/leads/${linkedLead.id}`}
                  className="text-(--color-accent) underline decoration-(--color-accent)/40 underline-offset-2 hover:decoration-(--color-accent)"
                >
                  {linkedLead.source === "configurator"
                    ? "↗ oorspronkelijke configurator-aanvraag"
                    : "↗ gekoppelde lead"}
                </NextLink>
              </>
            ) : null}
          </>
        }
        action={
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
        }
      />

      <OrgDetailTabs
        tabs={tabs}
        defaultTab="overview"
        panels={{
          overview: overviewPanel,
          subscription: subscriptionPanel,
          projects: projectsPanel,
          files: filesPanel,
          hours: hoursPanel,
          activity: activityPanel,
        }}
      />
    </div>
  );
}
