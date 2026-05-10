import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Smile, Meh, Frown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAllNpsResponses, getNpsStats } from "@/lib/db/queries/admin";

type Bucket = "promoter" | "passive" | "detractor";

const SCORE_BUCKETS: Record<Bucket, { label: string }> = {
  promoter: { label: "Promotor" },
  passive: { label: "Passief" },
  detractor: { label: "Detractor" },
};

function bucketFor(score: number | null): Bucket | null {
  if (score === null) return null;
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

const TONE_CLASS: Record<Bucket, string> = {
  promoter: "border-(--color-success)/30 bg-(--color-success)/5 text-(--color-success)",
  passive: "border-(--color-border) bg-(--color-bg-warm) text-(--color-text)",
  detractor: "border-(--color-wine)/30 bg-(--color-wine)/5 text-(--color-wine)",
};

export default async function AdminNpsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [rows, stats] = await Promise.all([listAllNpsResponses(), getNpsStats()]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[clamp(28px,4vw,38px)] leading-tight">NPS</h1>
        <p className="mt-2 max-w-prose text-[14px] text-(--color-muted)">
          Twee touchpoints per klant: 30 dagen en 180 dagen na livegang. Hier zie je alle responses
          + open uitnodigingen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="NPS-score"
          value={String(stats.npsScore)}
          sub={`gem. ${stats.avgScore}/10`}
        />
        <StatCard
          label="Promotors"
          value={String(stats.promoters)}
          sub={`${stats.respondedCount === 0 ? 0 : Math.round((stats.promoters / stats.respondedCount) * 100)}%`}
          icon={<Smile className="h-4 w-4 text-(--color-success)" strokeWidth={2.2} />}
        />
        <StatCard
          label="Passief"
          value={String(stats.passives)}
          icon={<Meh className="h-4 w-4 text-(--color-muted)" strokeWidth={2.2} />}
        />
        <StatCard
          label="Detractors"
          value={String(stats.detractors)}
          icon={<Frown className="h-4 w-4 text-(--color-wine)" strokeWidth={2.2} />}
        />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        <div className="border-b border-(--color-border) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {rows.length} responses & uitnodigingen
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-[14px] text-(--color-muted)">
            Nog geen NPS-data. Cron stuurt bij liveAt+30 en liveAt+180.
          </p>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {rows.map((r) => {
              const bucket = bucketFor(r.score);
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-(--color-text)">
                          {r.orgName ?? "—"}
                        </span>
                        {r.orgId ? (
                          <Link
                            href={{
                              pathname: "/admin/orgs/[id]" as never,
                              params: { id: r.orgId },
                            }}
                            className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase hover:underline"
                          >
                            org →
                          </Link>
                        ) : null}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                        {r.projectName ?? "—"} · dag {r.askedAfterDays} ·{" "}
                        {r.respondedAt
                          ? `beantwoord ${dateFmt.format(r.respondedAt)}`
                          : `gestuurd ${dateFmt.format(r.requestedAt)}`}
                      </p>
                      {r.comment ? (
                        <p className="mt-2 text-[13px] leading-[1.55] whitespace-pre-wrap text-(--color-text)">
                          {r.comment}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {r.score !== null && bucket ? (
                        <div
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-widest uppercase",
                            TONE_CLASS[bucket],
                          ].join(" ")}
                        >
                          <span className="font-serif text-[14px]">{r.score}/10</span>
                          <span>{SCORE_BUCKETS[bucket].label}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center rounded-full border border-dashed border-(--color-border) bg-(--color-bg-warm) px-3 py-1.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                          wacht op antwoord
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 font-serif text-[28px] leading-none text-(--color-text)">{value}</p>
      {sub ? (
        <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
