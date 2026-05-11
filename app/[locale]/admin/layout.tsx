import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNav } from "@/components/admin/AdminNav";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { Link } from "@/i18n/navigation";
import { DemoBanner } from "@/components/portal/DemoBanner";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { CommandKTrigger } from "@/components/admin/CommandKTrigger";
import { RouteTransition } from "@/components/portal/RouteTransition";

export default async function AdminLayout({
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

  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, email: true, isStaff: true, isDemo: true },
  });
  if (!me?.isStaff) {
    redirect("/portal/dashboard");
  }

  const t = await getTranslations("admin");
  const tDemo = await getTranslations("demo.banner");
  const tCmdK = await getTranslations("admin.cmdK");

  const sidebarLabels = {
    overview: t("nav.overview"),
    orgs: t("nav.orgs"),
    tickets: t("nav.tickets"),
    blog: t("nav.blog"),
    team: t("nav.team"),
    collapse: t("nav.collapse"),
    brandTagline: t("nav.brandTagline"),
    portalLink: t("nav.portalLink"),
  };

  return (
    <div className="flex min-h-screen flex-col">
      {me.isDemo ? <DemoBanner strings={{ label: tDemo("label"), cta: tDemo("cta") }} /> : null}

      <div className="flex min-h-0 flex-1">
        <AdminSidebar labels={sidebarLabels} email={me.email} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Minimal topbar — alleen cmd+K trigger + lang + portal-link
              op desktop. Mobile: brand + AdminNav als fallback. */}
          <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-bg)/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
              {/* Mobile-only brand */}
              <Link
                href="/admin"
                className="flex items-baseline gap-2 text-[16px] font-extrabold tracking-[-0.04em] text-(--color-text) md:hidden"
              >
                <span>
                  w<span className="text-(--color-accent)">.</span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.1em] text-(--color-muted) uppercase">
                  studio
                </span>
              </Link>

              {/* Cmd+K search trigger — desktop primary */}
              <div className="ml-auto flex items-center gap-2 md:ml-0 md:flex-1">
                <CommandKTrigger placeholder={tCmdK("placeholder")} />
              </div>

              <div className="flex items-center gap-3">
                <LangSwitcher />
              </div>
            </div>

            {/* Mobile-only nav-pills onderaan topbar */}
            <div className="px-4 pb-3 md:hidden">
              <AdminNav
                labels={{
                  overview: t("nav.overview"),
                  orgs: t("nav.orgs"),
                  tickets: t("nav.tickets"),
                  team: t("nav.team"),
                }}
              />
            </div>
          </header>

          <main className="flex-1 px-6 py-8 md:px-8 md:py-10">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>
      </div>

      <CommandPalette
        strings={{
          placeholder: tCmdK("placeholder"),
          empty: tCmdK("empty"),
          emptyHint: tCmdK("emptyHint"),
          recentTitle: tCmdK("recentTitle"),
          hintEnter: tCmdK("hintEnter"),
          hintEsc: tCmdK("hintEsc"),
          hintArrows: tCmdK("hintArrows"),
          closeLabel: tCmdK("closeLabel"),
        }}
      />
    </div>
  );
}
