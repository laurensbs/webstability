import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listAllOrgs } from "@/lib/db/queries/admin";
import { type OrgRow } from "@/components/admin/OrgTable";
import { OrgListWithBulk } from "@/components/admin/orgs/OrgListWithBulk";
import { bulkMailOrgs } from "@/app/actions/admin-bulk";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function OrgsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.orgs");
  const tBulk = await getTranslations("admin.orgs.bulk");
  const orgs = await listAllOrgs();

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
      <AdminPageHeader
        title={t("title")}
        action={
          <Link
            href="/admin/orgs/new"
            className="hover:shadow-glow inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90"
          >
            + {t("newOrg")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <OrgListWithBulk
        orgs={rows}
        locale={locale}
        bulkMail={bulkMailOrgs}
        strings={{
          table: {
            searchPlaceholder: t("searchPlaceholder"),
            empty: t("empty"),
            vip: "VIP",
            members: (n) => t("members", { count: n }),
            projects: (n) => t("projects", { count: n }),
            openTickets: (n) => t("openTickets", { count: n }),
          },
          selectionLabel: tBulk("selectionLabel"),
          bulk: {
            selected: tBulk("selected"),
            mailAction: tBulk("mailAction"),
            clear: tBulk("clear"),
          },
          modal: {
            title: tBulk("modal.title"),
            body: tBulk("modal.body"),
            templateLabel: tBulk("modal.templateLabel"),
            templates: {
              short_update: {
                name: tBulk("modal.templates.short_update.name"),
                description: tBulk("modal.templates.short_update.description"),
              },
              invoice_reminder: {
                name: tBulk("modal.templates.invoice_reminder.name"),
                description: tBulk("modal.templates.invoice_reminder.description"),
              },
              quarterly_report: {
                name: tBulk("modal.templates.quarterly_report.name"),
                description: tBulk("modal.templates.quarterly_report.description"),
              },
            },
            cancel: tBulk("modal.cancel"),
            confirm: tBulk("modal.confirm"),
            confirmHint: tBulk("modal.confirmHint"),
            sending: tBulk("modal.sending"),
          },
          toast: {
            success: tBulk("toast.success"),
            error: tBulk("toast.error"),
          },
        }}
      />
    </div>
  );
}
