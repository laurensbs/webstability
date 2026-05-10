import { eq, and, asc, desc, count, gte, lt, sum, gt, isNull, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  projects,
  tickets,
  invoices,
  files,
  hoursLogged,
  buildPhases,
  monitoringChecks,
  incidents,
} from "@/lib/db/schema";

export async function listOrgMembers(orgId: string) {
  return db.query.users.findMany({
    where: eq(users.organizationId, orgId),
    orderBy: [asc(users.createdAt)],
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function listOrgFiles(orgId: string) {
  return db.query.files.findMany({
    where: eq(files.organizationId, orgId),
    orderBy: [desc(files.createdAt)],
  });
}

export async function getUserWithOrg(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { organization: true },
  });
}

export async function getDashboardStats(orgId: string) {
  const [openTicketsRow] = await db
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), eq(tickets.status, "open")));

  const [activeProjectsRow] = await db
    .select({ n: count() })
    .from(projects)
    .where(and(eq(projects.organizationId, orgId), eq(projects.status, "in_progress")));

  const [openInvoicesRow] = await db
    .select({ n: count() })
    .from(invoices)
    .where(and(eq(invoices.organizationId, orgId), eq(invoices.status, "sent")));

  const highPriorityTickets = await db.query.tickets.findFirst({
    where: and(
      eq(tickets.organizationId, orgId),
      eq(tickets.status, "open"),
      eq(tickets.priority, "high"),
    ),
  });

  return {
    openTickets: openTicketsRow.n,
    activeProjects: activeProjectsRow.n,
    openInvoices: openInvoicesRow.n,
    hasHighPriority: Boolean(highPriorityTickets),
  };
}

export async function listOrgProjects(orgId: string) {
  return db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
    orderBy: [desc(projects.createdAt)],
  });
}

export async function listOrgTickets(orgId: string) {
  return db.query.tickets.findMany({
    where: eq(tickets.organizationId, orgId),
    orderBy: [desc(tickets.createdAt)],
    with: { user: { columns: { name: true, email: true } } },
  });
}

export async function getTicketWithReplies(orgId: string, ticketId: string) {
  return db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)),
    with: {
      replies: {
        orderBy: (r, { asc }) => [asc(r.createdAt)],
        with: { user: { columns: { id: true, name: true, email: true, isStaff: true } } },
      },
      user: { columns: { id: true, name: true, email: true, isStaff: true } },
    },
  });
}

export async function listOrgInvoices(orgId: string) {
  return db.query.invoices.findMany({
    where: eq(invoices.organizationId, orgId),
    orderBy: [desc(invoices.createdAt)],
  });
}

/**
 * Eerstvolgende lopende build-fase voor een organisatie. Een org heeft
 * typisch 0 of 1 actieve build tegelijk; we zoeken de fase waarvan
 * endsAt nog in de toekomst ligt en pakken degene die het laatst is
 * gestart als er meerdere zouden zijn.
 */
export async function getActiveBuildPhase(orgId: string) {
  return db.query.buildPhases.findFirst({
    where: and(eq(buildPhases.organizationId, orgId), gt(buildPhases.endsAt, new Date())),
    orderBy: [desc(buildPhases.startedAt)],
    with: { project: { columns: { id: true, name: true, status: true, progress: true } } },
  });
}

/**
 * Sommatie + recent log van uren-werk in de huidige kalendermaand.
 * Gebruikt door de hours-widget op het portal-dashboard.
 */
export async function getOrgHoursThisMonth(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalRow] = await db
    .select({ minutes: sum(hoursLogged.minutes) })
    .from(hoursLogged)
    .where(
      and(
        eq(hoursLogged.organizationId, orgId),
        gte(hoursLogged.workedOn, startOfMonth),
        lt(hoursLogged.workedOn, startOfNextMonth),
      ),
    );

  const recent = await db.query.hoursLogged.findMany({
    where: and(
      eq(hoursLogged.organizationId, orgId),
      gte(hoursLogged.workedOn, startOfMonth),
      lt(hoursLogged.workedOn, startOfNextMonth),
    ),
    orderBy: [desc(hoursLogged.workedOn)],
    limit: 5,
  });

  return {
    minutesUsed: Number(totalRow?.minutes ?? 0),
    recent,
    monthStart: startOfMonth,
  };
}

/**
 * Projecten van een org die binnen `days` dagen geleden live zijn
 * gegaan. Voor de feestelijke banner op portal-dashboard.
 */
/**
 * SEO-uren van afgelopen 30d voor een org. Filter op description LIKE
 * %seo% / %search% / %ranking% — geen `category` kolom op hours_logged,
 * dus we leunen op tekst-match. Werkt prima omdat staff in praktijk
 * "SEO meta-titles ES versie" o.i.d. logt.
 */
export async function getOrgSeoHours(orgId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      workedOn: hoursLogged.workedOn,
      minutes: hoursLogged.minutes,
      description: hoursLogged.description,
    })
    .from(hoursLogged)
    .where(
      and(
        eq(hoursLogged.organizationId, orgId),
        gte(hoursLogged.workedOn, since),
        or(
          ilike(hoursLogged.description, "%seo%"),
          ilike(hoursLogged.description, "%search%"),
          ilike(hoursLogged.description, "%ranking%"),
        ),
      ),
    )
    .orderBy(desc(hoursLogged.workedOn))
    .limit(15);
}

/**
 * "Wat is er veranderd sinds je laatste login" — strikte aggregaten,
 * geen identifiers. Wordt op /portal/dashboard getoond als korte strip
 * boven de StatusBanner. Window = max(1d, lastLoginAt..now). Onder 24h
 * is de strip leeg om herhaling te vermijden — caller filtert daarop.
 */
export async function getActivitySince(orgId: string, since: Date) {
  // Tickets gesloten sinds `since`
  const closedTickets = await db
    .select({ n: count() })
    .from(tickets)
    .where(
      and(
        eq(tickets.organizationId, orgId),
        eq(tickets.status, "closed"),
        gte(tickets.closedAt, since),
      ),
    );

  // Nieuwe invoices (status=sent of paid) sinds `since`
  const newInvoices = await db
    .select({ n: count() })
    .from(invoices)
    .where(and(eq(invoices.organizationId, orgId), gte(invoices.createdAt, since)));

  // Recent live-gegane projecten in deze window (verschillend van de
  // 7-dagen ReferralCard; hier is de window flexibel per laatste login)
  const livegangs = await db
    .select({ n: count() })
    .from(projects)
    .where(and(eq(projects.organizationId, orgId), gte(projects.liveAt, since)));

  // Incidents in deze window (open of resolved) — voor "monitoring
  // stabiel"-message
  const incidentRows = await db
    .select({ id: incidents.id, resolvedAt: incidents.resolvedAt })
    .from(incidents)
    .innerJoin(projects, eq(projects.id, incidents.projectId))
    .where(and(eq(projects.organizationId, orgId), gte(incidents.startedAt, since)));

  return {
    ticketsClosed: Number(closedTickets[0]?.n ?? 0),
    invoicesNew: Number(newInvoices[0]?.n ?? 0),
    livegangs: Number(livegangs[0]?.n ?? 0),
    incidents: incidentRows.length,
    incidentsResolved: incidentRows.filter((r) => r.resolvedAt !== null).length,
  };
}

/**
 * Project van de org waarvan de livegang ≥ 90 dagen geleden is. Gebruikt
 * door de ReferralCard op /portal/dashboard — strategie: pas referral
 * vragen ná 90 dagen, niet eerder. Geeft het oudste live-project terug
 * (één is genoeg om de card te tonen).
 */
export async function getReferralEligibleProject(orgId: string, daysBefore = 90) {
  const cutoff = new Date(Date.now() - daysBefore * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      liveAt: projects.liveAt,
    })
    .from(projects)
    .where(and(eq(projects.organizationId, orgId), lt(projects.liveAt, cutoff)))
    .orderBy(asc(projects.liveAt))
    .limit(1);
  const row = rows[0];
  if (!row || !row.liveAt) return null;
  return { id: row.id, name: row.name, liveAt: row.liveAt as Date };
}

export async function getRecentLivegangs(orgId: string, days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      monitoringTargetUrl: projects.monitoringTargetUrl,
      liveAt: projects.liveAt,
    })
    .from(projects)
    .where(and(eq(projects.organizationId, orgId), gte(projects.liveAt, cutoff)))
    .orderBy(desc(projects.liveAt))
    .limit(3);
  // null filter — drizzle-types laten liveAt als nullable, maar gte(...,
  // cutoff) garandeert non-null. Cast veilig.
  return rows.filter((r): r is typeof r & { liveAt: Date } => r.liveAt !== null);
}

/**
 * Per-project uptime-data voor de laatste N dagen. Voor de sparkline
 * op portal-monitoring én voor een binnenkort komende admin-overview.
 */
export async function getProjectUptime(projectId: string, days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      status: monitoringChecks.status,
      responseTimeMs: monitoringChecks.responseTimeMs,
      checkedAt: monitoringChecks.checkedAt,
    })
    .from(monitoringChecks)
    .where(and(eq(monitoringChecks.projectId, projectId), gte(monitoringChecks.checkedAt, cutoff)))
    .orderBy(asc(monitoringChecks.checkedAt));
  return rows;
}

/**
 * Open incidents voor één org — gebruikt door portal-dashboard om
 * een wijn-rode banner te tonen bij actieve storingen.
 */
export async function getActiveIncidentsForOrg(orgId: string) {
  return db
    .select({
      id: incidents.id,
      projectId: incidents.projectId,
      startedAt: incidents.startedAt,
      severity: incidents.severity,
      summary: incidents.summary,
      projectName: projects.name,
      monitoringTargetUrl: projects.monitoringTargetUrl,
    })
    .from(incidents)
    .leftJoin(projects, eq(incidents.projectId, projects.id))
    .where(and(eq(projects.organizationId, orgId), isNull(incidents.resolvedAt)))
    .orderBy(desc(incidents.startedAt));
}
