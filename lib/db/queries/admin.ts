import { eq, and, desc, count, sql, gte, lt, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizations,
  projects,
  tickets,
  invoices,
  users,
  hoursLogged,
  staffInvites,
  subscriptions,
  discounts,
  auditLog,
} from "@/lib/db/schema";

export async function listAllOrgs() {
  // Aggregate counts per org so the index page is one query.
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      country: organizations.country,
      plan: organizations.plan,
      isVip: organizations.isVip,
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

/**
 * Plan-distribution + MRR voor de admin overview. Gebruikt de
 * organizations.plan kolom als bron — als er geen plan staat
 * tellen we de org als 'unassigned'. MRR wordt berekend door de
 * pricing.ts CARE_PLANS map (zelfde getallen als de pricing page).
 */
export async function getRevenueStats() {
  const rows = await db
    .select({
      plan: organizations.plan,
      n: count(),
    })
    .from(organizations)
    .groupBy(organizations.plan);

  // Pricing per plan in EUR/m, parallel aan lib/stripe.ts CARE_PLANS.
  const PRICE: Record<string, number> = { care: 95, studio: 179, atelier: 399 };

  const distribution = { care: 0, studio: 0, atelier: 0, unassigned: 0 };
  let mrr = 0;
  for (const row of rows) {
    const plan = row.plan ?? "unassigned";
    const n = Number(row.n);
    if (plan in distribution) distribution[plan as keyof typeof distribution] = n;
    if (plan in PRICE) mrr += PRICE[plan]! * n;
  }

  return {
    distribution,
    mrr,
    arr: mrr * 12,
  };
}

/**
 * Totaal werk-uren deze maand cross-org — voor admin overview.
 * Helpt staff bij te houden hoe vol de planning op studio-niveau
 * staat ("X uur al verzet, Y uur openstaand budget over alle
 * klanten heen").
 */
export async function getCrossOrgHoursThisMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalRow] = await db
    .select({ minutes: sql<number>`coalesce(sum(${hoursLogged.minutes}), 0)` })
    .from(hoursLogged)
    .where(
      and(gte(hoursLogged.workedOn, startOfMonth), lt(hoursLogged.workedOn, startOfNextMonth)),
    );

  return Number(totalRow?.minutes ?? 0);
}

/**
 * Lijst openstaande staff-invites (niet ge-accept, niet revoked, niet
 * expired). Gebruikt door /admin/team.
 */
export async function listPendingStaffInvites() {
  return db.query.staffInvites.findMany({
    where: and(
      isNull(staffInvites.acceptedAt),
      isNull(staffInvites.revokedAt),
      gt(staffInvites.expiresAt, new Date()),
    ),
    orderBy: [desc(staffInvites.createdAt)],
  });
}

/**
 * Alle users met isStaff=true. Voor de "Studio-staff" sectie op /admin/team.
 */
export async function listStudioStaff() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.isStaff, true))
    .orderBy(desc(users.createdAt));
}

/**
 * Volledige org-overview voor het admin detail-page met alle relaties:
 * members, projects, latest subscription, recente discounts, recente
 * audit-events. Gebruikt door de tab-layout.
 */
export async function getOrgFullView(orgId: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    with: {
      members: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      projects: { orderBy: [desc(projects.createdAt)] },
    },
  });
  if (!org) return null;

  const [latestSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const recentDiscounts = await db
    .select({
      id: discounts.id,
      percentOff: discounts.percentOff,
      monthsApplied: discounts.monthsApplied,
      reason: discounts.reason,
      createdAt: discounts.createdAt,
      stripeCouponId: discounts.stripeCouponId,
    })
    .from(discounts)
    .where(eq(discounts.organizationId, orgId))
    .orderBy(desc(discounts.createdAt))
    .limit(20);

  const recentAuditEvents = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.organizationId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return { org, latestSub: latestSub ?? null, recentDiscounts, recentAuditEvents };
}
