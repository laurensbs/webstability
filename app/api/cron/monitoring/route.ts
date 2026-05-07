import { NextResponse } from "next/server";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, monitoringChecks, incidents } from "@/lib/db/schema";

/**
 * Monitoring-cron — pingt elke 5 min alle projects met een
 * monitoringTargetUrl, schrijft een monitoringChecks-row en handelt
 * incident-state af:
 *
 * - Status flipt up→down: open een nieuw incidents-row (severity 'high',
 *   summary "automated check failed").
 * - Status flipt down→up: vul resolvedAt op het open incident.
 *
 * Auth: Vercel injecteert `Authorization: Bearer ${CRON_SECRET}` op
 * cron-invocaties. Lokaal kun je dezelfde header sturen om handmatig
 * te triggeren.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIMEOUT_MS = 8000;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // geen secret = open (dev/staging)
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

async function pingUrl(url: string): Promise<{
  status: "up" | "degraded" | "down";
  responseTimeMs: number | null;
}> {
  const started = Date.now();
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: ac.signal,
      // Sommige hosts blokkeren HEAD; faillig naar GET in catch.
    }).catch(async () => {
      return fetch(url, { method: "GET", cache: "no-store", signal: ac.signal });
    });
    clearTimeout(timer);
    const elapsed = Date.now() - started;
    if (!res.ok) {
      return { status: res.status >= 500 ? "down" : "degraded", responseTimeMs: elapsed };
    }
    return { status: elapsed > 3000 ? "degraded" : "up", responseTimeMs: elapsed };
  } catch {
    return { status: "down", responseTimeMs: null };
  }
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const monitored = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      name: projects.name,
      url: projects.monitoringTargetUrl,
    })
    .from(projects)
    .where(and(isNotNull(projects.monitoringTargetUrl), eq(projects.status, "live")));

  let checked = 0;
  const results: Array<{ id: string; status: string; ms: number | null }> = [];

  for (const project of monitored) {
    if (!project.url) continue;
    const { status, responseTimeMs } = await pingUrl(project.url);
    await db.insert(monitoringChecks).values({
      projectId: project.id,
      targetUrl: project.url,
      status,
      responseTimeMs,
    });

    // Open / resolve incidents
    const openIncident = await db.query.incidents.findFirst({
      where: and(eq(incidents.projectId, project.id), isNull(incidents.resolvedAt)),
    });

    if (status === "down") {
      if (!openIncident) {
        await db.insert(incidents).values({
          projectId: project.id,
          startedAt: new Date(),
          severity: "high",
          summary: `Automated check kon ${project.url} niet bereiken.`,
          type: "incident",
        });
      }
    } else if (openIncident && status === "up") {
      await db
        .update(incidents)
        .set({ resolvedAt: new Date() })
        .where(eq(incidents.id, openIncident.id));
    }

    checked += 1;
    results.push({ id: project.id, status, ms: responseTimeMs });
  }

  return NextResponse.json({ checked, results });
}
