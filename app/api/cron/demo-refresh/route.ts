import { NextResponse } from "next/server";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, projects, incidents, tickets, users } from "@/lib/db/schema";

/**
 * Demo-refresh cron — elke 6 uur. Houdt de demo-data "levend" zodat
 * herhaalde bezoekers niet steeds dezelfde statische staat zien.
 *
 * 1. Incident-flip op het demo-incident: open → closed na 2u, closed →
 *    open na 6u. Zo krijgt elke bezoeker óf de actieve incident-banner
 *    (dramatisch) óf een net-opgelost-staat (kalm) te zien.
 * 2. Roteer priority op één demo-ticket low ↔ high zodat de kanban-
 *    grid niet identiek blijft.
 * 3. Bump demo-portal-user.lastLoginAt naar minutes-geleden zodat de
 *    "laatst gezien" tekst varieert.
 *
 * Auth: Vercel injecteert Bearer CRON_SECRET; lokaal niet vereist.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const demoOrg = await db.query.organizations.findFirst({
    where: eq(organizations.isDemo, true),
    columns: { id: true },
  });
  if (!demoOrg) {
    // Demo-seed niet gedraaid — no-op, niet failen.
    return NextResponse.json({ skipped: "no_demo_org" });
  }

  // Vind het demo-project (verhuurplatform — heeft de monitoring-checks).
  const demoProject = await db.query.projects.findFirst({
    where: and(eq(projects.organizationId, demoOrg.id), isNotNull(projects.monitoringTargetUrl)),
    columns: { id: true },
  });

  const actions: string[] = [];

  // === 1. Incident-flip ===
  if (demoProject) {
    const openInc = await db.query.incidents.findFirst({
      where: and(eq(incidents.projectId, demoProject.id), isNull(incidents.resolvedAt)),
    });

    if (openInc) {
      const ageMs = Date.now() - openInc.startedAt.getTime();
      if (ageMs > 2 * HOUR) {
        await db
          .update(incidents)
          .set({ resolvedAt: new Date() })
          .where(eq(incidents.id, openInc.id));
        actions.push("incident_resolved");
      }
    } else {
      // Geen open — kijken of er recent één was, of we openen er een nieuwe.
      const lastInc = await db.query.incidents.findFirst({
        where: eq(incidents.projectId, demoProject.id),
        orderBy: [desc(incidents.startedAt)],
      });
      const lastResolvedMs = lastInc?.resolvedAt
        ? Date.now() - lastInc.resolvedAt.getTime()
        : Infinity;
      if (lastResolvedMs > 6 * HOUR) {
        await db.insert(incidents).values({
          projectId: demoProject.id,
          startedAt: new Date(),
          summary: "Reactietijden boven 2s — onderzoeken DB-pool",
          severity: "high",
          type: "incident",
        });
        actions.push("incident_opened");
      }
    }
  }

  // === 2. Roteer priority op één open demo-ticket ===
  const demoTicket = await db.query.tickets.findFirst({
    where: and(eq(tickets.organizationId, demoOrg.id), eq(tickets.status, "open")),
    orderBy: [desc(tickets.createdAt)],
  });
  if (demoTicket) {
    const next = demoTicket.priority === "high" ? "low" : "high";
    await db.update(tickets).set({ priority: next }).where(eq(tickets.id, demoTicket.id));
    actions.push(`ticket_priority_${next}`);
  }

  // === 3. Bump demo-portal-user lastLoginAt ===
  const portalUser = await db.query.users.findFirst({
    where: and(eq(users.email, "demo-portal@webstability.eu"), eq(users.isDemo, true)),
    columns: { id: true },
  });
  if (portalUser) {
    const minutesAgo = Math.floor(Math.random() * 30) + 1;
    await db
      .update(users)
      .set({ lastLoginAt: new Date(Date.now() - minutesAgo * MIN) })
      .where(eq(users.id, portalUser.id));
    actions.push(`portal_lastlogin_${minutesAgo}m`);
  }

  return NextResponse.json({ org: demoOrg.id, actions });
}
