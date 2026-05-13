import { NextResponse } from "next/server";
import { and, eq, gt, gte, sum, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  buildPhases,
  projectUpdates,
  hoursLogged,
  users,
  auditLog,
} from "@/lib/db/schema";
import { sendWeeklyUpdateMail } from "@/lib/email/weekly-update";

/**
 * Wekelijkse update-cron — runt woensdag 09:00 (Vercel cron-config).
 * Voor elke org met een actieve build-fase: bundel updates van afgelopen
 * 7 dagen + uren-totaal + volgende mijlpaal en stuur naar de owner.
 *
 * Faalt graceful per org — een failure bij één klant blokkeert de
 * andere niet. Audit-log entry per verstuurde mail.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - WEEK_MS);

  // Vind alle actieve build-phases (endsAt > now). Voor elke phase de
  // bijhorende project + org + owner. We versturen één mail per project,
  // ook als één org meerdere actieve builds heeft.
  const phases = await db
    .select({
      phaseId: buildPhases.id,
      projectId: buildPhases.projectId,
      orgId: buildPhases.organizationId,
      startedAt: buildPhases.startedAt,
      endsAt: buildPhases.endsAt,
    })
    .from(buildPhases)
    .where(gt(buildPhases.endsAt, now));

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const phase of phases) {
    if (!phase.projectId) {
      skipped.push(`${phase.phaseId}:no-project`);
      continue;
    }
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, phase.projectId),
        columns: {
          id: true,
          name: true,
          nextMilestone: true,
          organizationId: true,
        },
      });
      if (!project) {
        skipped.push(`${phase.phaseId}:project-not-found`);
        continue;
      }

      const owner = await db.query.users.findFirst({
        where: and(eq(users.organizationId, project.organizationId), eq(users.role, "owner")),
        columns: { email: true, name: true, locale: true, isDemo: true },
      });
      if (!owner?.email || owner.isDemo) {
        skipped.push(`${phase.phaseId}:no-owner-or-demo`);
        continue;
      }

      // Updates van laatste 7 dagen
      const recentUpdates = await db
        .select({
          body: projectUpdates.body,
          createdAt: projectUpdates.createdAt,
          postedByName: users.name,
        })
        .from(projectUpdates)
        .leftJoin(users, eq(users.id, projectUpdates.postedBy))
        .where(
          and(
            eq(projectUpdates.projectId, project.id),
            gte(projectUpdates.createdAt, sevenDaysAgo),
          ),
        )
        .orderBy(desc(projectUpdates.createdAt));

      // Uren laatste 7 dagen op dit project
      const [hoursRow] = await db
        .select({ minutes: sum(hoursLogged.minutes) })
        .from(hoursLogged)
        .where(and(eq(hoursLogged.projectId, project.id), gte(hoursLogged.workedOn, sevenDaysAgo)));
      const hoursThisWeek = Number(hoursRow?.minutes ?? 0);

      // Week-index berekenen
      const total = (phase.endsAt?.getTime() ?? now.getTime()) - phase.startedAt.getTime();
      const elapsed = Math.max(0, now.getTime() - phase.startedAt.getTime());
      const weekIndex = Math.max(1, Math.floor(elapsed / WEEK_MS) + 1);
      const totalWeeks = Math.max(weekIndex, Math.ceil(total / WEEK_MS));

      const portalUrl = `${process.env.AUTH_URL ?? "https://webstability.eu"}/${
        owner.locale === "es" ? "es/" : ""
      }portal/projects/${project.id}`;

      await sendWeeklyUpdateMail({
        to: owner.email,
        ownerName: owner.name,
        projectName: project.name,
        weekIndex,
        totalWeeks,
        updates: recentUpdates.map((u) => ({
          body: u.body,
          postedAt: u.createdAt,
          postedBy: u.postedByName,
        })),
        hoursThisWeek,
        nextMilestone: project.nextMilestone,
        portalUrl,
        locale: owner.locale === "es" ? "es" : "nl",
      });

      await db.insert(auditLog).values({
        organizationId: project.organizationId,
        userId: null,
        action: "weekly_update_sent",
        targetType: "project",
        targetId: project.id,
        metadata: {
          weekIndex,
          totalWeeks,
          updatesCount: recentUpdates.length,
          hoursMinutes: hoursThisWeek,
        },
      });

      sent.push(project.id);
    } catch (err) {
      console.error(`[weekly-update] phase ${phase.phaseId} failed:`, err);
      skipped.push(`${phase.phaseId}:error`);
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
