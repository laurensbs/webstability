import { eq, count, isNotNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, projects, monitoringChecks } from "@/lib/db/schema";

/**
 * Studio-status voor de klant-variant van /login. Bewust dezelfde
 * filosofie als `AdminLoginTagline` op de admin-host: één rotating
 * regel die zegt "het werkt, je betaalt niet voor lucht".
 *
 * Twee modi:
 * - Bezoeker met cookie `last_org` (slug) → toont stats van die org:
 *   uptime + days-live van het oudste live-project.
 * - Anonieme bezoeker → toont studio-niveau stats: aantal actieve
 *   klanten + of er een build loopt.
 *
 * Server-cache via Next's `revalidate`-mechanisme moet op de caller
 * zitten (page.tsx); deze functies zijn pure DB-reads.
 */

export type LoginStatLine = string[];

const FALLBACK: LoginStatLine = ["webstability draait."];

/**
 * Haal stats voor één klant op aan de hand van de `last_org` cookie.
 * Geen identifying data: alleen aggregaten van die org. Als de slug
 * niet bestaat (oude cookie / verwijderde org) → null.
 */
export async function getOrgLoginStatLine(slug: string): Promise<LoginStatLine | null> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: { id: true, name: true },
  });
  if (!org) return null;

  // Oudste live-project van deze org — geeft "X dagen live" + uptime.
  const liveProject = await db
    .select({
      id: projects.id,
      name: projects.name,
      liveAt: projects.liveAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, org.id))
    .orderBy(asc(projects.liveAt))
    .limit(1);

  const proj = liveProject[0];
  if (!proj || !proj.liveAt) {
    return [`${org.name} · webstability draait.`];
  }

  const days = Math.max(
    1,
    Math.floor((Date.now() - proj.liveAt.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Uptime over laatste 1000 monitoring-checks van dit project.
  const checks = await db
    .select({ status: monitoringChecks.status })
    .from(monitoringChecks)
    .where(eq(monitoringChecks.projectId, proj.id))
    .limit(1000);

  let uptimePart: string | null = null;
  if (checks.length > 0) {
    const ups = checks.filter((c) => c.status === "up").length;
    const pct = (ups / checks.length) * 100;
    uptimePart = `${pct.toFixed(2)}% uptime`;
  }

  const parts = [org.name];
  if (uptimePart) parts.push(uptimePart);
  parts.push(`${days} ${days === 1 ? "dag" : "dagen"} live`);

  return [parts.join(" · ")];
}

/**
 * Anonieme bezoeker — toon studio-staat zonder klant-namen.
 */
export async function getAnonymousLoginStatLine(): Promise<LoginStatLine> {
  try {
    const [orgRow] = await db.select({ n: count() }).from(organizations);
    const orgsCount = orgRow?.n ?? 0;

    const [activeProj] = await db
      .select({ n: count() })
      .from(projects)
      .where(eq(projects.status, "in_progress"));
    const activeBuilds = activeProj?.n ?? 0;

    const [liveProj] = await db
      .select({ n: count() })
      .from(projects)
      .where(isNotNull(projects.liveAt));
    const liveCount = liveProj?.n ?? 0;

    const lines: string[] = [];
    if (orgsCount > 0) {
      lines.push(`${orgsCount} ${orgsCount === 1 ? "klant" : "klanten"} actief`);
    }
    if (liveCount > 0) {
      lines.push(`${liveCount} ${liveCount === 1 ? "platform" : "platforms"} live`);
    }
    if (activeBuilds > 0) {
      lines.push(`${activeBuilds} ${activeBuilds === 1 ? "build" : "builds"} loopt`);
    }
    if (lines.length === 0) return FALLBACK;
    return lines;
  } catch {
    return FALLBACK;
  }
}
