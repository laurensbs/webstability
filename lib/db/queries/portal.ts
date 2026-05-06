import { eq, and, asc, desc, count, gte, lt, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projects, tickets, invoices, files, hoursLogged } from "@/lib/db/schema";

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
        with: { user: { columns: { name: true, email: true } } },
      },
      user: { columns: { name: true, email: true } },
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
