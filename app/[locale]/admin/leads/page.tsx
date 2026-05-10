import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAllLeads, getLeadStats } from "@/lib/db/queries/admin";
import { LEAD_SOURCE_LABEL_NL, LEAD_STATUS_LABEL_NL, type LeadStatus } from "@/lib/leads";

const STATUS_TONE: Record<LeadStatus, string> = {
  cold: "border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)",
  warmed: "border-(--color-accent)/30 bg-(--color-accent)/5 text-(--color-accent)",
  booked: "border-(--color-accent)/40 bg-(--color-accent)/10 text-(--color-accent)",
  met: "border-(--color-wine)/30 bg-(--color-wine)/5 text-(--color-wine)",
  customer: "border-(--color-success)/30 bg-(--color-success)/5 text-(--color-success)",
  lost: "border-(--color-border) bg-(--color-bg) text-(--color-muted)",
};

export default async function AdminLeadsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [rows, stats] = await Promise.all([listAllLeads(), getLeadStats()]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[clamp(28px,4vw,38px)] leading-tight">Leads</h1>
          <p className="mt-2 max-w-prose text-[14px] text-(--color-muted)">
            Outreach-pipeline. Houd vijf actieve gesprekken per week — kwaliteit boven volume.
          </p>
        </div>
        <Link
          href={{ pathname: "/admin/leads/new" as never }}
          className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
          Nieuwe lead
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(LEAD_STATUS_LABEL_NL) as LeadStatus[]).map((s) => (
          <div key={s} className={["rounded-[12px] border px-4 py-3", STATUS_TONE[s]].join(" ")}>
            <p className="font-mono text-[10px] tracking-widest uppercase">
              {LEAD_STATUS_LABEL_NL[s]}
            </p>
            <p className="mt-1 font-serif text-[20px] leading-none">{stats[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        <div className="border-b border-(--color-border) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {rows.length} leads
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-(--color-muted)">
            Nog geen leads. Maak er een aan om te beginnen — of wacht tot een demo-bezoek of
            Cal-booking de eerste binnenbrengt.
          </p>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={{
                    pathname: "/admin/leads/[id]" as never,
                    params: { id: r.id },
                  }}
                  className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[14px] font-medium text-(--color-text)">
                        {r.name ?? r.email}
                      </span>
                      {r.company ? (
                        <span className="font-mono text-[11px] text-(--color-muted)">
                          · {r.company}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                      {r.email} · bron: {LEAD_SOURCE_LABEL_NL[r.source]}
                      {r.ownerName ? ` · ${r.ownerName}` : ""}
                    </p>
                    {r.nextActionAt && r.nextActionLabel ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-(--color-wine)/5 px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-wine) uppercase">
                        {dateFmt.format(r.nextActionAt)} · {r.nextActionLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase",
                        STATUS_TONE[r.status],
                      ].join(" ")}
                    >
                      {LEAD_STATUS_LABEL_NL[r.status]}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-(--color-muted)" strokeWidth={2} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
