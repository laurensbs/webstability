import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, getDashboardStats } from "@/lib/db/queries/portal";
import { StatCard } from "@/components/portal/StatCard";

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
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-5xl">
          {greeting}, <em>{firstName}</em>.
        </h1>
        <p className="text-(--color-muted)">{status}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.openTickets")} value={String(stats.openTickets)} />
        <StatCard label={t("stats.activeProjects")} value={String(stats.activeProjects)} />
        <StatCard label={t("stats.openInvoices")} value={String(stats.openInvoices)} />
        <StatCard label={t("stats.uptime")} value="—" hint="Phase 4" />
      </section>
    </div>
  );
}
