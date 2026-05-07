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
} from "@/lib/db/queries/admin";
import { StatCard } from "@/components/portal/StatCard";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { FlashCounter } from "@/components/animate/FlashCounter";
import { AdminWelcomeOnboarding } from "@/components/admin/AdminWelcomeOnboarding";
import { StudioStatusStrip } from "@/components/admin/StudioStatusStrip";

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tOnboarding = await getTranslations("admin.onboarding");
  const tStrip = await getTranslations("admin.statusStrip");
  const [stats, events, revenue, crossOrgMinutes, statusStrip] = await Promise.all([
    getStudioStats(),
    getRecentAdminActivity(8),
    getRevenueStats(),
    getCrossOrgHoursThisMonth(),
    getStudioStatusStrip(),
  ]);

  // Eerste-keer detectie: lastLoginAt wordt door het signIn-event in
  // lib/auth.ts pas ná de session-cookie gezet — bij allereerste paint
  // van /admin staat 'ie nog op null. Toont de onboarding-card. Ook als
  // lastLoginAt strict ouder is dan createdAt (kan voorkomen als
  // promote pas later gebeurde) tonen we 'm; dat is een pure
  // timestamp-vergelijking, geen Date.now() in render.
  const session = await auth();
  let isFirstTimeStaff = false;
  let firstName = "";
  if (session?.user?.id) {
    const me = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true, lastLoginAt: true, createdAt: true },
    });
    if (me) {
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
      {isFirstTimeStaff ? (
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
            step: tOnboarding("step"),
          }}
        />
      ) : null}

      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
      </header>

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
