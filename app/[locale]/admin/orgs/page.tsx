import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listAllOrgs } from "@/lib/db/queries/admin";
import { OrgTable, type OrgRow } from "@/components/admin/OrgTable";

export default async function OrgsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.orgs");
  const orgs = await listAllOrgs();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  // Cast naar OrgRow shape — runtime nummer-conversies in een keer.
  const rows: OrgRow[] = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    country: o.country,
    plan: o.plan,
    isVip: Boolean(o.isVip),
    createdAt: o.createdAt,
    memberCount: Number(o.memberCount),
    projectCount: Number(o.projectCount),
    openTicketCount: Number(o.openTicketCount),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <Link
          href="/admin/orgs/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)]"
        >
          + {t("newOrg")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <OrgTable
        orgs={rows}
        dateFmt={dateFmt}
        strings={{
          searchPlaceholder: t("searchPlaceholder"),
          empty: t("empty"),
          vip: "VIP",
          members: (n) => t("members", { count: n }),
          projects: (n) => t("projects", { count: n }),
          openTickets: (n) => t("openTickets", { count: n }),
        }}
      />
    </div>
  );
}
