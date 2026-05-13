import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq, desc, sql, count, and, gte, lt, isNull, or } from "drizzle-orm";
import {
  Activity,
  AlertTriangle,
  Check,
  Clock,
  Database,
  Inbox,
  Mail,
  Server,
  UserPlus,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, auditLog, tickets, leads, organizations } from "@/lib/db/schema";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripePriceSyncBanner } from "@/components/admin/StripePriceSyncBanner";

export const dynamic = "force-dynamic";

/**
 * /admin/health — operationeel dashboard. Eén plek waar staff in 5 sec ziet
 * of álles loopt: Stripe-sync, cron-runs (weekly-update, monthly-report,
 * nps), ticket-leeftijd, leads-zonder-follow-up, env-vars. Geen muteer-acties
 * hier; puur status. Bij geel/wijn-rood weet je waar je moet kijken.
 */
const CRITICAL_ENVS = [
  "DATABASE_URL",
  "AUTH_URL",
  "AUTH_SECRET",
  "EMAIL_FROM",
  "EMAIL_SERVER_HOST",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_CARE",
  "STRIPE_PRICE_STUDIO",
  "STRIPE_PRICE_ATELIER",
] as const;

const OPTIONAL_ENVS = [
  "ANTHROPIC_API_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "BETTERSTACK_API_KEY",
  "MAIL_AUDIT_BCC",
  "NEXT_PUBLIC_CAL_LINK",
  "STRIPE_REFERRAL_COUPON",
] as const;

async function lastAuditFor(action: string): Promise<Date | null> {
  const row = await db
    .select({ createdAt: auditLog.createdAt })
    .from(auditLog)
    .where(eq(auditLog.action, action))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  return row[0]?.createdAt ?? null;
}

export default async function AdminHealthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) notFound();
  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { isStaff: true },
  });
  if (!me?.isStaff) notFound();

  // Parallel: alle metrics ophalen in één rondje.
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

  const [
    lastWeekly,
    lastMonthly,
    lastNps,
    openTickets,
    staleTickets,
    untouchedLeads,
    totalOrgs,
    recentLogins,
  ] = await Promise.all([
    lastAuditFor("weekly_update_sent"),
    lastAuditFor("monthly_report_sent"),
    lastAuditFor("nps_asked"),
    db.select({ c: count() }).from(tickets).where(eq(tickets.status, "open")),
    // Tickets > 3 dagen open zonder staff-reactie — proxy: status nog "open"
    db
      .select({ c: count() })
      .from(tickets)
      .where(and(eq(tickets.status, "open"), lt(tickets.createdAt, threeDaysAgo))),
    // Leads zonder nextActionAt of waarvan die in het verleden ligt
    db
      .select({ c: count() })
      .from(leads)
      .where(
        and(
          or(isNull(leads.nextActionAt), lt(leads.nextActionAt, now)),
          // Niet alles meetellen — alleen leads van laatste 40 dagen, oudere
          // zijn waarschijnlijk dood (zou een cron op moeten zetten).
          gte(leads.createdAt, fortyDaysAgo),
        ),
      ),
    db.select({ c: count() }).from(organizations),
    db
      .select({ c: count() })
      .from(users)
      .where(and(gte(users.lastLoginAt, sevenDaysAgo))),
  ]);

  // Env-checks (runtime — werkt alleen op de server, niet build-time)
  const missingCritical = CRITICAL_ENVS.filter((k) => !process.env[k]);
  const missingOptional = OPTIONAL_ENVS.filter((k) => !process.env[k]);

  const cards: Array<{
    icon: typeof Activity;
    title: string;
    value: React.ReactNode;
    status: "ok" | "warn" | "alarm";
    hint?: string;
  }> = [
    {
      icon: Mail,
      title: "Laatste weekly-update",
      value: lastWeekly ? relative(lastWeekly, now) : "nooit",
      status:
        !lastWeekly || lastWeekly < new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
          ? "warn"
          : "ok",
      hint:
        !lastWeekly || lastWeekly < new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
          ? "Cron `/api/cron/weekly-update` (woensdag 09:00) heeft >10 dagen niet gedraaid."
          : undefined,
    },
    {
      icon: Mail,
      title: "Laatste monthly-report",
      value: lastMonthly ? relative(lastMonthly, now) : "nooit",
      status:
        !lastMonthly || lastMonthly < new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)
          ? "warn"
          : "ok",
      hint:
        !lastMonthly || lastMonthly < new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)
          ? "Cron `/api/cron/monthly-report` heeft >40 dagen niet gedraaid."
          : undefined,
    },
    {
      icon: Mail,
      title: "Laatste NPS-mail",
      value: lastNps ? relative(lastNps, now) : "nooit",
      status: "ok",
    },
    {
      icon: Inbox,
      title: "Open tickets",
      value: String(openTickets[0]?.c ?? 0),
      status: (openTickets[0]?.c ?? 0) > 10 ? "warn" : "ok",
    },
    {
      icon: Clock,
      title: "Stale tickets (>3d open)",
      value: String(staleTickets[0]?.c ?? 0),
      status:
        (staleTickets[0]?.c ?? 0) > 0 ? ((staleTickets[0]?.c ?? 0) > 3 ? "alarm" : "warn") : "ok",
      hint:
        (staleTickets[0]?.c ?? 0) > 0
          ? "Tickets die langer dan 3 dagen open staan. Antwoord deze eerst."
          : undefined,
    },
    {
      icon: UserPlus,
      title: "Leads zonder follow-up",
      value: String(untouchedLeads[0]?.c ?? 0),
      status:
        (untouchedLeads[0]?.c ?? 0) > 0
          ? (untouchedLeads[0]?.c ?? 0) > 5
            ? "alarm"
            : "warn"
          : "ok",
      hint:
        (untouchedLeads[0]?.c ?? 0) > 0
          ? "nextActionAt is null of in het verleden. Zet een opvolg-datum op /admin/leads."
          : undefined,
    },
    {
      icon: Database,
      title: "Totaal orgs",
      value: String(totalOrgs[0]?.c ?? 0),
      status: "ok",
    },
    {
      icon: Activity,
      title: "Recente logins (7d)",
      value: String(recentLogins[0]?.c ?? 0),
      status: "ok",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="// health"
        subtitle="Operationele status — vijf seconden om te zien of alles loopt. Geen muteer-acties; puur status."
      />

      {/* Stripe-sync (zelfde banner als op /admin) */}
      <Suspense fallback={null}>
        <StripePriceSyncBanner />
      </Suspense>

      {/* Env-checks */}
      <section className="space-y-3">
        <h2 className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {"// env-vars"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <EnvCard
            label="Kritieke vars"
            missing={missingCritical as unknown as string[]}
            kind="critical"
          />
          <EnvCard
            label="Optionele vars"
            missing={missingOptional as unknown as string[]}
            kind="optional"
          />
        </div>
      </section>

      {/* Cron + ops-metrics */}
      <section className="space-y-3">
        <h2 className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {"// operatie"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <li
              key={c.title}
              className={`rounded-lg border bg-(--color-surface) p-4 ${
                c.status === "alarm"
                  ? "border-(--color-wine)/40 bg-(--color-wine)/5"
                  : c.status === "warn"
                    ? "border-(--color-accent)/30 bg-(--color-accent-soft)/30"
                    : "border-(--color-border)"
              }`}
            >
              <div className="flex items-start gap-2">
                <c.icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    c.status === "alarm"
                      ? "text-(--color-wine)"
                      : c.status === "warn"
                        ? "text-(--color-accent)"
                        : "text-(--color-muted)"
                  }`}
                  strokeWidth={2}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                    {c.title}
                  </p>
                  <p className="mt-1 font-serif text-[20px] leading-none tabular-nums">{c.value}</p>
                  {c.hint ? (
                    <p className="mt-2 text-[12px] leading-snug text-(--color-text)/80">{c.hint}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EnvCard({
  label,
  missing,
  kind,
}: {
  label: string;
  missing: string[];
  kind: "critical" | "optional";
}) {
  const ok = missing.length === 0;
  const color = ok
    ? "border-(--color-border)"
    : kind === "critical"
      ? "border-(--color-wine)/40 bg-(--color-wine)/5"
      : "border-(--color-accent)/30 bg-(--color-accent-soft)/30";
  const Icon = ok ? Check : kind === "critical" ? AlertTriangle : Server;
  const iconColor = ok
    ? "text-(--color-success)"
    : kind === "critical"
      ? "text-(--color-wine)"
      : "text-(--color-accent)";

  return (
    <div className={`rounded-lg border bg-(--color-surface) p-4 ${color}`}>
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} strokeWidth={2} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
            {label}
          </p>
          {ok ? (
            <p className="mt-1 text-[13px] text-(--color-text)">Alles gezet.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 font-mono text-[12px] text-(--color-text)">
              {missing.map((k) => (
                <li key={k}>missing · {k}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function relative(d: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s geleden`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`;
  if (diff < 86400 * 14) return `${Math.floor(diff / 86400)}d geleden`;
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(d);
}
