import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Gift, Check, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAllReferrals, getReferralStats } from "@/lib/db/queries/referrals";

const APP_URL = process.env.AUTH_URL ?? "https://webstability.eu";

export default async function AdminReferralsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [rows, stats] = await Promise.all([listAllReferrals(), getReferralStats()]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="inline-flex items-center gap-3 font-serif text-[clamp(28px,4vw,38px)] leading-tight">
          <Gift className="h-7 w-7 text-(--color-wine)" strokeWidth={2} />
          Referrals
        </h1>
        <p className="mt-2 max-w-prose text-[14px] text-(--color-muted)">
          Elke klant krijgt na 90 dagen live een deelbare link op het dashboard. Wie via die link
          checkout doet, krijgt automatisch de Stripe-coupon — beide partijen €250 korting op Care,
          zes maanden.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Totaal codes" value={String(rows.length)} />
        <StatCard label="In afwachting" value={String(stats.pending)} tone="pending" />
        <StatCard label="Geconverteerd" value={String(stats.converted)} tone="converted" />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        <div className="border-b border-(--color-border) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {rows.length} referral-codes
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-(--color-muted)">
            Nog geen codes. Ze worden automatisch aangemaakt zodra een klant de ReferralCard op zijn
            dashboard ziet (90 dagen na livegang).
          </p>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {rows.map((r) => {
              const converted = r.convertedOrgId !== null;
              return (
                <li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[14px] font-medium text-(--color-text)">
                        {r.referrerName ?? "—"}
                      </span>
                      <Link
                        href={{
                          pathname: "/admin/orgs/[id]" as never,
                          params: { id: r.referrerOrgId },
                        }}
                        className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase hover:underline"
                      >
                        org →
                      </Link>
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                      {APP_URL.replace(/^https?:\/\//, "")}/refer/{r.code} · aangemaakt{" "}
                      {dateFmt.format(r.createdAt)}
                    </p>
                    {converted && r.discountAppliedAt ? (
                      <p className="mt-2 text-[13px] text-(--color-success)">
                        ✓ Geconverteerd door {r.convertedName ?? "—"} ·{" "}
                        {dateFmt.format(r.discountAppliedAt)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={[
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase",
                      converted
                        ? "border-(--color-success)/30 bg-(--color-success)/5 text-(--color-success)"
                        : "border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)",
                    ].join(" ")}
                  >
                    {converted ? (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <Clock className="h-3 w-3" strokeWidth={2.4} />
                    )}
                    {converted ? "Geconverteerd" : "In afwachting"}
                  </span>
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
  tone,
}: {
  label: string;
  value: string;
  tone?: "pending" | "converted";
}) {
  const toneClass =
    tone === "converted"
      ? "border-(--color-success)/30 bg-(--color-success)/5"
      : tone === "pending"
        ? "border-(--color-border) bg-(--color-bg-warm)"
        : "border-(--color-border) bg-(--color-surface)";
  return (
    <div className={["rounded-[12px] border p-5", toneClass].join(" ")}>
      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {label}
      </p>
      <p className="mt-1 font-serif text-[24px] leading-none text-(--color-text)">{value}</p>
    </div>
  );
}
