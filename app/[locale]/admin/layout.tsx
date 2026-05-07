import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";
import { AdminNav } from "@/components/admin/AdminNav";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { Link } from "@/i18n/navigation";
import { DemoBanner } from "@/components/portal/DemoBanner";

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
    // Don't 404 — show a friendly message via redirect to dashboard.
    redirect("/portal/dashboard");
  }

  const t = await getTranslations("admin");
  const tDemo = await getTranslations("demo.banner");

  return (
    <div className="min-h-screen">
      {me.isDemo ? <DemoBanner strings={{ label: tDemo("label"), cta: tDemo("cta") }} /> : null}
      <header className="border-b border-(--color-text)/15 bg-(--color-text) text-(--color-bg)">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="flex items-baseline gap-3 text-lg font-extrabold tracking-tight text-(--color-bg)"
          >
            <span>
              webstability<span className="text-(--color-accent)">.</span>
            </span>
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: "rgba(245, 240, 232, 0.6)" }}
            >
              Eén plek voor je
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-xs text-(--color-bg)/55 md:block">{me.email}</p>
            <LangSwitcher />
            <Link
              href="/portal/dashboard"
              className="font-mono text-xs tracking-widest text-(--color-bg)/65 uppercase hover:text-(--color-accent)"
            >
              ↗ portal
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-4">
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
      <main className="mx-auto max-w-7xl px-6 py-8 md:py-12">{children}</main>
    </div>
  );
}
