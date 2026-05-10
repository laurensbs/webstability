import { eq, and, desc, count, sql, gte, lt, isNull, gt, asc } from "drizzle-orm";
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
  demoEvents,
  incidents,
  bookings,
  buildPhases,
  projectUpdates,
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
      // Subqueries gebruiken expliciete table-aliassen (u/p/t) zodat
      // Postgres niet de inner kolom-resolutie pakt voor "id". Zonder
      // alias resolved Postgres "id" naar de subquery's eigen tabel
      // (bv. users.id, dat is een text-PK), wat een uuid=text type-mismatch
      // geeft. Met expliciete alias + organizations.id als outer ref
      // krijgt de planner het juiste type.
      memberCount: sql<number>`(select count(*) from ${users} u where u.organization_id = ${organizations.id})`,
      projectCount: sql<number>`(select count(*) from ${projects} p where p.organization_id = ${organizations.id})`,
      openTicketCount: sql<number>`(select count(*) from ${tickets} t where t.organization_id = ${organizations.id} and t.status = 'open')`,
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

/**
 * Cross-org tickets voor de kanban-view. Bevat alle 4 statussen,
 * met reply-count per ticket en org/user-relations. Limiet zit op 200
 * meest-recente tickets — snel genoeg en de UI wordt niet onleesbaar.
 */
export async function listAllTicketsForKanban() {
  const all = await db.query.tickets.findMany({
    orderBy: [desc(tickets.createdAt)],
    limit: 200,
    with: {
      organization: { columns: { id: true, name: true, slug: true } },
      user: { columns: { name: true, email: true } },
    },
  });

  // Reply-count per ticket — één SQL-query met group-by zou efficiënter
  // zijn maar drizzle's relations laten dit niet trivial doen; voor 200
  // tickets is dit goed genoeg.
  const replyCountsRaw = await db.execute(
    sql`select ticket_id, count(*) as n from ticket_replies group by ticket_id`,
  );
  const counts = new Map<string, number>();
  for (const row of replyCountsRaw.rows as Array<{ ticket_id: string; n: string }>) {
    counts.set(row.ticket_id, Number(row.n));
  }

  return all.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    category: t.category,
    priority: t.priority,
    overBudget: t.overBudget,
    createdAt: t.createdAt,
    organization: t.organization ?? { id: "", name: "—", slug: "" },
    user: t.user,
    replyCount: counts.get(t.id) ?? 0,
  }));
}

/**
 * Per-org meest recente monitoring-status voor de admin status-strip.
 * Returnt voor elke org de aggregate status van zijn projects (worst-case
 * van alle live-projecten met een recent check). Geen check binnen 30 min
 * = "unknown". Voor visuele admin-overview-grid waar 1 dot = 1 org.
 */
export async function getStudioStatusStrip() {
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      isVip: organizations.isVip,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt));

  // Recentste check per live-project in één raw-SQL met DISTINCT ON.
  const latestPerProject = await db.execute(sql`
    select distinct on (mc.project_id)
      mc.project_id,
      mc.status,
      p.organization_id
    from monitoring_checks mc
    join projects p on p.id = mc.project_id
    where p.status = 'live'
    order by mc.project_id, mc.checked_at desc
  `);

  type Status = "up" | "degraded" | "down" | "unknown";
  const orgStatus = new Map<string, Status>();
  for (const row of latestPerProject.rows as Array<{
    project_id: string;
    status: "up" | "degraded" | "down";
    organization_id: string;
  }>) {
    const cur = orgStatus.get(row.organization_id) ?? "unknown";
    if (row.status === "down") orgStatus.set(row.organization_id, "down");
    else if (row.status === "degraded" && cur !== "down")
      orgStatus.set(row.organization_id, "degraded");
    else if (row.status === "up" && cur === "unknown") orgStatus.set(row.organization_id, "up");
  }

  return orgs.map((o) => ({
    ...o,
    status: orgStatus.get(o.id) ?? ("unknown" as Status),
  }));
}

/**
 * Snapshot van de demo-omgeving: laatste cron-flip (proxy via meest
 * recente incident-mutatie op de demo-org), aantal demo-logins/CTA-
 * clicks deze week. Gebruikt door DemoManagementCard op /admin.
 */
export async function getDemoSnapshot() {
  const demoOrg = await db.query.organizations.findFirst({
    where: eq(organizations.isDemo, true),
    columns: { id: true },
  });

  // Laatste cron-flip: meest recente incident-mutatie op een demo-org-
  // project. Cron flipt incidents elke 6h — het meest recente
  // resolvedAt (of startedAt als nog open) is een goede proxy voor
  // "wanneer liep de cron voor het laatst".
  let lastRunAt: Date | null = null;
  if (demoOrg) {
    const recent = await db
      .select({
        startedAt: incidents.startedAt,
        resolvedAt: incidents.resolvedAt,
      })
      .from(incidents)
      .innerJoin(projects, eq(projects.id, incidents.projectId))
      .where(eq(projects.organizationId, demoOrg.id))
      .orderBy(desc(incidents.startedAt))
      .limit(1);
    const r = recent[0];
    if (r) lastRunAt = r.resolvedAt ?? r.startedAt;
  }

  // Demo-login + CTA-events deze week.
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eventRows = await db
    .select({ kind: demoEvents.kind, n: count() })
    .from(demoEvents)
    .where(gte(demoEvents.createdAt, cutoff))
    .groupBy(demoEvents.kind);
  const counts: Record<string, number> = {};
  for (const r of eventRows) counts[r.kind] = Number(r.n);

  return {
    hasDemoOrg: Boolean(demoOrg),
    lastRunAt,
    weeklyEntered: counts.entered ?? 0,
    weeklyCtaClicks: counts.cta_clicked ?? 0,
  };
}

/**
 * Klanten met een actieve build-fase die geen project_update hebben
 * gehad in de laatste N dagen (default 7). Gebruikt door
 * `StaleProjectsWidget` op /admin om "klanten zonder update deze week"
 * te tonen — voorkomt dat staff een klant in stilte laat hangen.
 */
export async function getStaleProjects(days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Alle actieve build-fases (endsAt > now)
  const activePhases = await db
    .select({
      projectId: buildPhases.projectId,
      orgId: buildPhases.organizationId,
      orgName: organizations.name,
      projectName: projects.name,
    })
    .from(buildPhases)
    .innerJoin(organizations, eq(organizations.id, buildPhases.organizationId))
    .leftJoin(projects, eq(projects.id, buildPhases.projectId))
    .where(gt(buildPhases.endsAt, now));

  const stale: Array<{
    projectId: string;
    orgId: string;
    orgName: string;
    projectName: string;
    lastUpdateAt: Date | null;
  }> = [];

  for (const p of activePhases) {
    if (!p.projectId || !p.projectName) continue;
    const lastUpdate = await db
      .select({ createdAt: projectUpdates.createdAt })
      .from(projectUpdates)
      .where(eq(projectUpdates.projectId, p.projectId))
      .orderBy(desc(projectUpdates.createdAt))
      .limit(1);
    const lastAt = lastUpdate[0]?.createdAt ?? null;
    if (!lastAt || lastAt < cutoff) {
      stale.push({
        projectId: p.projectId,
        orgId: p.orgId,
        orgName: p.orgName,
        projectName: p.projectName,
        lastUpdateAt: lastAt,
      });
    }
  }

  return stale;
}

/**
 * Aankomende calls — toont de eerstvolgende N gescheduled bookings
 * over alle orgs heen. Gebruikt door `UpcomingCallsWidget` op /admin
 * zodat staff in één oogopslag ziet wat er deze week komt en de
 * intake-antwoorden kan voorbereiden.
 */
export async function getUpcomingCalls(limit = 5) {
  const now = new Date();
  return db
    .select({
      id: bookings.id,
      type: bookings.type,
      startsAt: bookings.startsAt,
      attendeeEmail: bookings.attendeeEmail,
      attendeeName: bookings.attendeeName,
      meetingUrl: bookings.meetingUrl,
      notes: bookings.notes,
      organizationId: bookings.organizationId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(bookings)
    .innerJoin(organizations, eq(organizations.id, bookings.organizationId))
    .where(and(eq(bookings.status, "scheduled"), gte(bookings.startsAt, now)))
    .orderBy(asc(bookings.startsAt))
    .limit(limit);
}

/**
 * Funnel-stats voor de demo-bezoeken in laatste N dagen. Per-kind
 * count + unique-visit-count (op basis van ipHash). Conversion-rate
 * = cta_clicked / entered.
 */
export async function getDemoFunnelStats(days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      kind: demoEvents.kind,
      n: count(),
    })
    .from(demoEvents)
    .where(gte(demoEvents.createdAt, cutoff))
    .groupBy(demoEvents.kind);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.kind] = Number(r.n);

  const entered = counts.entered ?? 0;
  const ctaClicks = counts.cta_clicked ?? 0;
  const conversion = entered > 0 ? Math.round((ctaClicks / entered) * 100) : 0;

  return { entered, ctaClicks, conversion, days };
}
