import { NextResponse } from "next/server";
import { and, eq, gte, lt, sum, desc, count, inArray, like } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import {
  projects,
  organizations,
  subscriptions,
  hoursLogged,
  tickets,
  monitoringChecks,
  auditLog,
  files,
  users,
} from "@/lib/db/schema";
import { renderMonthlyReportHtml, sendMonthlyReportMail } from "@/lib/email/monthly-report";
import { budgetMinutesFor } from "@/lib/plan-budget";

/**
 * Maandrapport-cron — 1e van de maand 06:00. Voor elke org met
 * subscription studio/atelier én een live project: aggregeer vorige
 * maand (uptime, uren, tickets resolved, deploys) → mail naar owner
 * + HTML-snapshot in blob als files-row (category='report'). Audit-
 * log per verstuurd rapport.
 *
 * Faalt graceful per org — een failure bij één klant blokkeert de rest
 * niet.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const MONTH_NAMES_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];
const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Vorige kalendermaand. Bij run op 1 mei 06:00 → april (4) van dit jaar.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthIndex = monthStart.getMonth();
  const yearNumber = monthStart.getFullYear();

  // Eligible orgs: actieve subscription op plan studio/atelier.
  const eligibleOrgs = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      plan: subscriptions.plan,
    })
    .from(subscriptions)
    .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
    .where(
      and(inArray(subscriptions.plan, ["studio", "atelier"]), eq(subscriptions.status, "active")),
    );

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const org of eligibleOrgs) {
    try {
      // Eerste live-project voor deze org.
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.organizationId, org.orgId), eq(projects.status, "live")),
        orderBy: [desc(projects.liveAt)],
        columns: {
          id: true,
          name: true,
          liveAt: true,
          nextMilestone: true,
        },
      });
      if (!project) {
        skipped.push(`${org.orgId}:no-live-project`);
        continue;
      }

      const owner = await db.query.users.findFirst({
        where: and(eq(users.organizationId, org.orgId), eq(users.role, "owner")),
        columns: { email: true, name: true, locale: true, isDemo: true },
      });
      if (!owner?.email || owner.isDemo) {
        skipped.push(`${org.orgId}:no-owner-or-demo`);
        continue;
      }

      // Uren afgelopen maand op dit project
      const [hoursRow] = await db
        .select({ minutes: sum(hoursLogged.minutes) })
        .from(hoursLogged)
        .where(
          and(
            eq(hoursLogged.projectId, project.id),
            gte(hoursLogged.workedOn, monthStart),
            lt(hoursLogged.workedOn, monthEnd),
          ),
        );
      const hoursMinutes = Number(hoursRow?.minutes ?? 0);

      // Tickets resolved (status=closed) afgelopen maand voor deze org
      const [ticketsRow] = await db
        .select({ n: count() })
        .from(tickets)
        .where(
          and(
            eq(tickets.organizationId, org.orgId),
            eq(tickets.status, "closed"),
            gte(tickets.closedAt, monthStart),
            lt(tickets.closedAt, monthEnd),
          ),
        );
      const ticketsResolved = Number(ticketsRow?.n ?? 0);

      // Open items voor de banner / mail-vermelding
      const [openRow] = await db
        .select({ n: count() })
        .from(tickets)
        .where(and(eq(tickets.organizationId, org.orgId), eq(tickets.status, "open")));
      const openItems = Number(openRow?.n ?? 0);

      // Uptime: percentage 'up' checks van alle monitoring_checks in
      // de maand. Geen checks → 100% (geen monitoring betekent niet
      // automatisch slechte uptime; we geven geen valse alarm).
      const checksInMonth = await db
        .select({ status: monitoringChecks.status })
        .from(monitoringChecks)
        .where(
          and(
            eq(monitoringChecks.projectId, project.id),
            gte(monitoringChecks.checkedAt, monthStart),
            lt(monitoringChecks.checkedAt, monthEnd),
          ),
        );
      const upCount = checksInMonth.filter((c) => c.status === "up").length;
      const totalChecks = checksInMonth.length;
      const uptimePct = totalChecks > 0 ? (upCount / totalChecks) * 100 : 100;

      // Deploys uit audit_log (action like 'project.deploy%')
      const [deploysRow] = await db
        .select({ n: count() })
        .from(auditLog)
        .where(
          and(
            eq(auditLog.organizationId, org.orgId),
            like(auditLog.action, "project.deploy%"),
            gte(auditLog.createdAt, monthStart),
            lt(auditLog.createdAt, monthEnd),
          ),
        );
      const deploys = Number(deploysRow?.n ?? 0);

      // Highlights: maximaal 3 staff-update-zinnen uit audit_log
      // 'project.update_posted' metadata. We hebben alleen de count
      // bewaard, dus pakken we de drie meest recente updates uit
      // project_updates direct.
      const updateRows = await db.query.projectUpdates.findMany({
        where: (pu, { and, eq, gte, lt }) =>
          and(
            eq(pu.projectId, project.id),
            gte(pu.createdAt, monthStart),
            lt(pu.createdAt, monthEnd),
          ),
        orderBy: (pu, { desc }) => [desc(pu.createdAt)],
        limit: 3,
        columns: { body: true },
      });
      const highlights = updateRows
        .map((u) => u.body.split("\n")[0]?.trim() ?? "")
        .filter((s) => s.length > 0)
        .map((s) => (s.length > 120 ? `${s.slice(0, 117)}…` : s));

      const locale = owner.locale === "es" ? "es" : "nl";
      const monthLabel = `${locale === "es" ? MONTH_NAMES_ES[monthIndex] : MONTH_NAMES_NL[monthIndex]} ${yearNumber}`;
      const portalUrl = `${process.env.AUTH_URL ?? "https://webstability.eu"}/${
        locale === "es" ? "es/" : ""
      }portal/dashboard`;
      const planTier = (org.plan ?? null) as "care" | "studio" | "atelier" | null;
      const hoursBudgetMinutes = planTier ? budgetMinutesFor(planTier) : null;

      // Eerst snapshot bouwen + uploaden, daarna mail (zo bevat de mail
      // optioneel een link naar de snapshot).
      const { snapshotHtml, snapshotName } = renderMonthlyReportHtml({
        to: owner.email,
        ownerName: owner.name,
        projectName: project.name,
        monthLabel,
        uptimePct,
        hoursMinutes,
        ticketsResolved,
        deploys,
        highlights,
        openItems,
        portalUrl,
        reportUrl: null,
        nextMilestone: project.nextMilestone,
        plan: planTier,
        hoursBudgetMinutes,
        locale,
      });

      let reportUrl: string | null = null;
      let blobPath: string | null = null;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const safeName = `maandrapport-${yearNumber}-${String(monthIndex + 1).padStart(2, "0")}.html`;
        const path = `reports/${org.orgId}/${safeName}`;
        const blob = await put(path, snapshotHtml, {
          access: "public",
          contentType: "text/html; charset=utf-8",
          allowOverwrite: true,
        });
        reportUrl = blob.url;
        blobPath = path;

        await db.insert(files).values({
          organizationId: org.orgId,
          projectId: project.id,
          name: snapshotName,
          url: reportUrl,
          blobPath,
          category: "report",
          uploadedBy: null,
        });
      }

      await sendMonthlyReportMail({
        to: owner.email,
        ownerName: owner.name,
        projectName: project.name,
        monthLabel,
        uptimePct,
        hoursMinutes,
        ticketsResolved,
        deploys,
        highlights,
        openItems,
        portalUrl,
        reportUrl,
        nextMilestone: project.nextMilestone,
        plan: planTier,
        hoursBudgetMinutes,
        locale,
      });

      await db.insert(auditLog).values({
        organizationId: org.orgId,
        userId: null,
        action: "monthly_report_sent",
        targetType: "project",
        targetId: project.id,
        metadata: {
          monthLabel,
          uptimePct: Math.round(uptimePct * 100) / 100,
          hoursMinutes,
          ticketsResolved,
          deploys,
          reportUrl,
        },
      });

      sent.push(`${org.orgId}:${project.id}`);
    } catch (err) {
      console.error(`[monthly-report] org ${org.orgId} failed:`, err);
      skipped.push(`${org.orgId}:error`);
    }
  }

  return NextResponse.json({
    ok: true,
    sentCount: sent.length,
    skippedCount: skipped.length,
    sent,
    skipped,
  });
}
