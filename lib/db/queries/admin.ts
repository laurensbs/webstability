import { eq, and, desc, count, sql, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, projects, tickets, invoices, users, hoursLogged } from "@/lib/db/schema";

export async function listAllOrgs() {
  // Aggregate counts per org so the index page is one query.
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      country: organizations.country,
      plan: organizations.plan,
      createdAt: organizations.createdAt,
      memberCount: sql<number>`(select count(*) from ${users} where ${users.organizationId} = ${organizations.id})`,
      projectCount: sql<number>`(select count(*) from ${projects} where ${projects.organizationId} = ${organizations.id})`,
      openTicketCount: sql<number>`(select count(*) from ${tickets} where ${tickets.organizationId} = ${organizations.id} and ${tickets.status} = 'open')`,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt));

  return rows;
}

export async function getOrgWithDetails(orgId: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    with: {
      members: {
        columns: { id: true, name: true, email: true, role: true, lastLoginAt: true },
      },
      projects: { orderBy: [desc(projects.createdAt)] },
    },
  });
}

export async function listAllOpenTickets() {
  return db.query.tickets.findMany({
    where: eq(tickets.status, "open"),
    orderBy: [desc(tickets.createdAt)],
    with: {
      user: { columns: { name: true, email: true } },
      organization: { columns: { name: true, slug: true } },
    },
  });
}

/**
 * Cross-org activity feed for the admin overview. Pulls the most recent
 * tickets, projects, and invoices and merges them into a single sorted list
 * so staff see "what changed across all clients" at a glance.
 */
export async function getRecentAdminActivity(limit = 8) {
  const recentTickets = await db.query.tickets.findMany({
    orderBy: [desc(tickets.createdAt)],
    limit,
    with: { organization: { columns: { name: true } } },
  });
  const recentProjects = await db.query.projects.findMany({
    orderBy: [desc(projects.createdAt)],
    limit,
    with: { organization: { columns: { name: true } } },
  });
  // Invoices doesn't have a relational `organization` mapping defined, so
  // we manually join the org name in via a select.
  const recentInvoices = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      createdAt: invoices.createdAt,
      orgName: organizations.name,
    })
    .from(invoices)
    .leftJoin(organizations, eq(invoices.organizationId, organizations.id))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);

  const events = [
    ...recentTickets.map((t) => ({
      kind: "ticket" as const,
      id: t.id,
      label: t.subject,
      orgName: t.organization?.name ?? "—",
      at: t.createdAt,
    })),
    ...recentProjects.map((p) => ({
      kind: "project" as const,
      id: p.id,
      label: p.name,
      orgName: p.organization?.name ?? "—",
      at: p.createdAt,
    })),
    ...recentInvoices.map((i) => ({
      kind: "invoice" as const,
      id: i.id,
      label: i.number,
      orgName: i.orgName ?? "—",
      at: i.createdAt,
    })),
  ];

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, limit);
}

/**
 * Hours-this-month voor één organisatie + de laatste 10 entries. De
 * admin org-detail pagina gebruikt dit om staff te laten zien hoeveel
 * uren er al gelogd zijn voordat ze nieuwe loggen.
 */
export async function getOrgHoursThisMonth(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalRow] = await db
    .select({ minutes: sql<number>`coalesce(sum(${hoursLogged.minutes}), 0)` })
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
    limit: 10,
    with: {
      project: { columns: { id: true, name: true } },
      loggedByUser: { columns: { id: true, name: true, email: true } },
    },
  });

  return {
    minutesUsed: Number(totalRow?.minutes ?? 0),
    recent,
  };
}

export async function getStudioStats() {
  const [orgs] = await db.select({ n: count() }).from(organizations);
  const [openTickets] = await db
    .select({ n: count() })
    .from(tickets)
    .where(eq(tickets.status, "open"));
  const [activeProjects] = await db
    .select({ n: count() })
    .from(projects)
    .where(eq(projects.status, "in_progress"));
  const [openInvoices] = await db
    .select({ n: count() })
    .from(invoices)
    .where(eq(invoices.status, "sent"));

  return {
    orgs: orgs.n,
    openTickets: openTickets.n,
    activeProjects: activeProjects.n,
    openInvoices: openInvoices.n,
  };
}
