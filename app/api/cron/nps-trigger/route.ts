import { NextResponse } from "next/server";
import { and, eq, gte, lt, isNotNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { projects, users, npsResponses, auditLog } from "@/lib/db/schema";
import { sendNpsAskMail } from "@/lib/email/nps-ask";

/**
 * NPS-cron — dagelijks 08:00. Voor elk project waarvan liveAt precies
 * 30 of 180 dagen geleden is, maak één nps_responses-rij aan (status
 * 'asked' = score null) met token en mail de owner.
 *
 * Idempotent — bestaande rij voor dezelfde (project, askedAfterDays)
 * wordt overgeslagen zodat dubbel verzenden niet kan.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIGGERS = [30, 180] as const;

function dayBucket(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = dayBucket(new Date());
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const days of TRIGGERS) {
    // liveAt valt op `today - days` (kalenderdag, niet 24h-windows)
    const cutoff = new Date(today.getTime() - days * DAY_MS);
    const next = new Date(cutoff.getTime() + DAY_MS);

    const liveProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        organizationId: projects.organizationId,
        liveAt: projects.liveAt,
      })
      .from(projects)
      .where(
        and(isNotNull(projects.liveAt), gte(projects.liveAt, cutoff), lt(projects.liveAt, next)),
      );

    for (const project of liveProjects) {
      try {
        // Skip als deze (project, days)-combo al bestaat
        const existing = await db.query.npsResponses.findFirst({
          where: and(eq(npsResponses.projectId, project.id), eq(npsResponses.askedAfterDays, days)),
          columns: { id: true },
        });
        if (existing) {
          skipped.push(`${project.id}:${days}:already`);
          continue;
        }

        const owner = await db.query.users.findFirst({
          where: and(eq(users.organizationId, project.organizationId), eq(users.role, "owner")),
          columns: { email: true, name: true, locale: true, isDemo: true },
        });
        if (!owner?.email || owner.isDemo) {
          skipped.push(`${project.id}:${days}:no-owner-or-demo`);
          continue;
        }

        const token = randomBytes(24).toString("base64url");
        await db.insert(npsResponses).values({
          organizationId: project.organizationId,
          projectId: project.id,
          askedAfterDays: days,
          token,
        });

        const locale = owner.locale === "es" ? "es" : "nl";
        const base = process.env.AUTH_URL ?? "https://webstability.eu";
        const link = `${base}/${locale === "es" ? "es/" : ""}portal/nps?token=${token}`;

        await sendNpsAskMail({
          to: owner.email,
          ownerName: owner.name,
          projectName: project.name,
          askedAfterDays: days,
          link,
          locale,
        });

        await db.insert(auditLog).values({
          organizationId: project.organizationId,
          userId: null,
          action: "nps_asked",
          targetType: "project",
          targetId: project.id,
          metadata: { askedAfterDays: days },
        });

        sent.push(`${project.id}:${days}`);
      } catch (err) {
        console.error(`[nps-trigger] project ${project.id} (${days}d) failed:`, err);
        skipped.push(`${project.id}:${days}:error`);
      }
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
