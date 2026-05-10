import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getLeadDetail, listStaffUsersForLeadOwner, listAllOrgs } from "@/lib/db/queries/admin";
import { LeadDetail } from "@/components/admin/LeadDetail";
import { LEAD_SOURCE_LABEL_NL, LEAD_STATUS_LABEL_NL, type LeadStatus } from "@/lib/leads";

const STATUS_TONE: Record<LeadStatus, string> = {
  cold: "border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)",
  warmed: "border-(--color-accent)/30 bg-(--color-accent)/5 text-(--color-accent)",
  booked: "border-(--color-accent)/40 bg-(--color-accent)/10 text-(--color-accent)",
  met: "border-(--color-wine)/30 bg-(--color-wine)/5 text-(--color-wine)",
  customer: "border-(--color-success)/30 bg-(--color-success)/5 text-(--color-success)",
  lost: "border-(--color-border) bg-(--color-bg) text-(--color-muted)",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [lead, staffList, orgs] = await Promise.all([
    getLeadDetail(id),
    listStaffUsersForLeadOwner(),
    listAllOrgs(),
  ]);
  if (!lead) notFound();

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href={{ pathname: "/admin/leads" as never }}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
          Terug naar leads
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[clamp(28px,4vw,38px)] leading-tight">
              {lead.name ?? lead.email}
            </h1>
            <p className="mt-2 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {lead.email}
              {lead.company ? ` · ${lead.company}` : ""} · bron: {LEAD_SOURCE_LABEL_NL[lead.source]}
            </p>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-widest uppercase",
              STATUS_TONE[lead.status],
            ].join(" ")}
          >
            {LEAD_STATUS_LABEL_NL[lead.status]}
          </span>
        </div>
        {lead.linkedOrg ? (
          <Link
            href={{
              pathname: "/admin/orgs/[id]" as never,
              params: { id: lead.linkedOrg.id },
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-(--color-success)/30 bg-(--color-success)/5 px-3 py-1.5 font-mono text-[11px] tracking-widest text-(--color-success) uppercase transition-colors hover:bg-(--color-success)/10"
          >
            <Building2 className="h-3 w-3" strokeWidth={2.4} />
            Klant: {lead.linkedOrg.name}
          </Link>
        ) : null}
      </div>

      <LeadDetail
        leadId={lead.id}
        initial={{
          status: lead.status,
          notes: lead.notes ?? "",
          nextActionAt: lead.nextActionAt ? lead.nextActionAt.toISOString() : "",
          nextActionLabel: lead.nextActionLabel ?? "",
          ownerStaffId: lead.ownerStaffId ?? "",
          linkedOrgId: lead.linkedOrgId ?? "",
        }}
        staffOptions={staffList.map((s) => ({
          id: s.id,
          label: s.name ?? s.email ?? s.id,
        }))}
        orgOptions={orgs.map((o) => ({ id: o.id, label: o.name }))}
        activity={lead.activity.map((a) => ({
          id: a.id,
          kind: a.kind,
          summary: a.summary,
          createdAt: timeFmt.format(a.createdAt),
          actorName: a.actorStaff?.name ?? a.actorStaff?.email ?? null,
        }))}
        createdAtLabel={dateFmt.format(lead.createdAt)}
      />
    </div>
  );
}
