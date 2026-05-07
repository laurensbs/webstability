import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/portal/Sidebar";
import { Topbar } from "@/components/portal/Topbar";
import { RouteTransition } from "@/components/portal/RouteTransition";
import { DemoBanner } from "@/components/portal/DemoBanner";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userWithOrg = await getUserWithOrg(session.user.id);
  if (!userWithOrg) redirect("/login");

  const t = await getTranslations("portal");
  const tDemo = await getTranslations("demo.banner");

  const navLabels = {
    dashboard: t("nav.dashboard"),
    projects: t("nav.projects"),
    tickets: t("nav.tickets"),
    invoices: t("nav.invoices"),
    monitoring: t("nav2.monitoring"),
    seo: t("nav2.seo"),
    files: t("nav2.files"),
    team: t("nav2.team"),
    settings: t("nav.settings"),
  };

  return (
    <div className="flex min-h-screen flex-col">
      {userWithOrg.isDemo ? (
        <DemoBanner strings={{ label: tDemo("label"), cta: tDemo("cta") }} />
      ) : null}
      <div className="flex min-h-0 flex-1">
        <Sidebar labels={navLabels} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            userEmail={userWithOrg.email}
            orgName={userWithOrg.organization?.name ?? null}
            logoutLabel={t("nav.logout")}
            navLabels={navLabels}
            isStaff={userWithOrg.isStaff}
          />
          <main className="flex-1 px-6 py-8 md:px-10 md:py-12">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-text)",
            color: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </div>
  );
}
