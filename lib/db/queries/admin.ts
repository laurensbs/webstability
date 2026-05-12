import { eq, and, desc, count, sql, gte, lt, isNull, gt, asc, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizations,
  projects,
  tickets,
  invoices,
  files,
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
  npsResponses,
  leads,
  intakeResponses,
  ticketReplies,
} from "@/lib/db/schema";

/** Files + facturen van één org, voor de admin "Files & facturen"-tab. */
export async function getOrgFilesAndInvoices(orgId: string) {
  const [orgFiles, orgInvoices] = await Promise.all([
    db
      .select({
        id: files.id,
        name: files.name,
        url: files.url,
        category: files.category,
        projectId: files.projectId,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(eq(files.organizationId, orgId))
      .orderBy(desc(files.createdAt)),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        amount: invoices.amount,
        vatAmount: invoices.vatAmount,
        currency: invoices.currency,
        status: invoices.status,
        dueAt: invoices.dueAt,
        paidAt: invoices.paidAt,
        pdfUrl: invoices.pdfUrl,
        stripeInvoiceId: invoices.stripeInvoiceId,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId))
      .orderBy(desc(invoices.createdAt)),
  ]);
  return { orgFiles, orgInvoices };
}

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
/** Eén ticket met z'n volledige reply-thread, org en aanvrager — voor de
 * admin-ticket-detailpagina. Geen org-scoping: staff ziet alles. */
export async function getAdminTicketDetail(ticketId: string) {
  return db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      replies: {
        orderBy: (r, { asc: a }) => [a(r.createdAt)],
        with: { user: { columns: { id: true, name: true, email: true, isStaff: true } } },
      },
      user: { columns: { id: true, name: true, email: true, isStaff: true } },
      organization: { columns: { id: true, name: true, slug: true } },
      project: { columns: { id: true, name: true } },
    },
  });
}

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

/**
 * Lijst alle NPS-responses (responded + asked-but-pending). Voor
 * /admin/nps overzicht. Inclusief org-naam en project-naam.
 */
export async function listAllNpsResponses() {
  return db
    .select({
      id: npsResponses.id,
      orgId: npsResponses.organizationId,
      orgName: organizations.name,
      projectId: npsResponses.projectId,
      projectName: projects.name,
      askedAfterDays: npsResponses.askedAfterDays,
      requestedAt: npsResponses.requestedAt,
      respondedAt: npsResponses.respondedAt,
      score: npsResponses.score,
      comment: npsResponses.comment,
    })
    .from(npsResponses)
    .leftJoin(organizations, eq(organizations.id, npsResponses.organizationId))
    .leftJoin(projects, eq(projects.id, npsResponses.projectId))
    .orderBy(desc(npsResponses.requestedAt));
}

/**
 * Aggregate NPS-stats: gemiddelde score, aantal promotors/passives/
 * detractors, response-rate. Alleen responded rows tellen.
 */
export async function getNpsStats() {
  const all = await db
    .select({ score: npsResponses.score, respondedAt: npsResponses.respondedAt })
    .from(npsResponses);
  const responded = all.filter((r) => r.respondedAt !== null && r.score !== null);
  const total = all.length;
  const respondedCount = responded.length;
  const promoters = responded.filter((r) => (r.score ?? 0) >= 9).length;
  const passives = responded.filter((r) => (r.score ?? 0) >= 7 && (r.score ?? 0) <= 8).length;
  const detractors = responded.filter((r) => (r.score ?? 0) <= 6).length;
  const avg =
    respondedCount > 0 ? responded.reduce((s, r) => s + (r.score ?? 0), 0) / respondedCount : 0;
  const nps = respondedCount > 0 ? ((promoters - detractors) / respondedCount) * 100 : 0;
  return {
    total,
    respondedCount,
    promoters,
    passives,
    detractors,
    avgScore: Math.round(avg * 10) / 10,
    npsScore: Math.round(nps),
  };
}

/**
 * Alle leads voor /admin/leads. Eenvoudige lijst met owner-naam +
 * activity-count. Geen pagination — tot ~500 leads is dit prima.
 */
export async function listAllLeads() {
  return (
    db
      .select({
        id: leads.id,
        email: leads.email,
        name: leads.name,
        company: leads.company,
        source: leads.source,
        status: leads.status,
        nextActionAt: leads.nextActionAt,
        nextActionLabel: leads.nextActionLabel,
        ownerStaffId: leads.ownerStaffId,
        ownerName: users.name,
        linkedOrgId: leads.linkedOrgId,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .leftJoin(users, eq(users.id, leads.ownerStaffId))
      // Leads met een geplande follow-up bovenaan, soonest first (overdue/vandaag
      // eerst), daarna de rest op recentheid — zo zie je in één scan wat er nu moet.
      .orderBy(
        sql`case when ${leads.nextActionAt} is null then 1 else 0 end`,
        asc(leads.nextActionAt),
        desc(leads.updatedAt),
      )
  );
}

/** De aan een org gekoppelde lead (indien er een is) — voor de "oorspronkelijke
 * aanvraag"-link op de org-detailpagina. Geeft id + source terug zodat de UI
 * alleen bij een configurator-lead linkt. */
export async function getLinkedLeadForOrg(
  orgId: string,
): Promise<{ id: string; source: string } | null> {
  const row = await db.query.leads.findFirst({
    where: eq(leads.linkedOrgId, orgId),
    columns: { id: true, source: true },
  });
  return row ?? null;
}

/**
 * Detail-page voor één lead — lead + activity-tijdlijn + owner-staff
 * + (indien gekoppeld) linked-org-naam.
 */
export async function getLeadDetail(leadId: string) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    with: {
      ownerStaff: { columns: { id: true, name: true, email: true } },
      linkedOrg: { columns: { id: true, name: true, slug: true } },
      activity: {
        orderBy: (a, { desc }) => [desc(a.createdAt)],
        limit: 50,
        with: {
          actorStaff: { columns: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return lead ?? null;
}

/**
 * Reminders voor /admin dashboard-widget: leads met nextActionAt
 * <= today AND status not in (customer, lost). Toont vandaag +
 * overdue.
 */
export async function listLeadRemindersDueToday() {
  const now = new Date();
  return db
    .select({
      id: leads.id,
      email: leads.email,
      name: leads.name,
      company: leads.company,
      status: leads.status,
      nextActionAt: leads.nextActionAt,
      nextActionLabel: leads.nextActionLabel,
    })
    .from(leads)
    .where(
      and(
        isNotNull(leads.nextActionAt),
        lt(leads.nextActionAt, new Date(now.getTime() + 24 * 60 * 60 * 1000)),
        ne(leads.status, "customer"),
        ne(leads.status, "lost"),
      ),
    )
    .orderBy(asc(leads.nextActionAt));
}

/** Aantal open configurator-aanvragen (source=configurator, status nog niet
 * customer/lost) — voor een teller in de admin-"// vandaag"-zone. */
export async function countOpenConfiguratorLeads(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(leads)
    .where(
      and(eq(leads.source, "configurator"), ne(leads.status, "customer"), ne(leads.status, "lost")),
    );
  return Number(row?.n ?? 0);
}

/** Aantal open tickets met prioriteit 'high' — voor de admin-"// vandaag"-zone. */
export async function countHighPriorityOpenTickets(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.status, "open"), eq(tickets.priority, "high")));
  return Number(row?.n ?? 0);
}

/**
 * Tickets waarbij de klant het laatst gereageerd heeft — d.w.z. de bal ligt
 * bij staff. Niet-gesloten tickets, waarvan de meest recente reply van een
 * niet-staff user is. Voor de "klant heeft gereageerd"-feed op het admin-
 * dashboard zodat je niet de tickets-pagina hoeft af te struinen.
 */
export async function getTicketsAwaitingStaffReply(limit = 8): Promise<
  Array<{
    id: string;
    subject: string;
    orgName: string | null;
    orgId: string | null;
    lastReplyAt: Date;
    replyExcerpt: string;
  }>
> {
  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      orgName: organizations.name,
      orgId: tickets.organizationId,
      lastReplyAt: ticketReplies.createdAt,
      replyBody: ticketReplies.body,
      authorIsStaff: users.isStaff,
    })
    .from(ticketReplies)
    .innerJoin(tickets, eq(tickets.id, ticketReplies.ticketId))
    .innerJoin(users, eq(users.id, ticketReplies.userId))
    .leftJoin(organizations, eq(organizations.id, tickets.organizationId))
    .where(
      and(
        ne(tickets.status, "closed"),
        // Alleen de laatste reply per ticket meenemen.
        sql`${ticketReplies.createdAt} = (select max(tr2.created_at) from ${ticketReplies} tr2 where tr2.ticket_id = ${tickets.id})`,
      ),
    )
    .orderBy(desc(ticketReplies.createdAt))
    .limit(limit * 3); // ruim ophalen, dan client-side filteren op non-staff

  return rows
    .filter((r) => !r.authorIsStaff)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      subject: r.subject,
      orgName: r.orgName,
      orgId: r.orgId,
      lastReplyAt: r.lastReplyAt,
      replyExcerpt: r.replyBody.length > 90 ? `${r.replyBody.slice(0, 90)}…` : r.replyBody,
    }));
}

/**
 * Lijst alle staff-users voor de "owner"-dropdown op lead-detail.
 */
export async function listStaffUsersForLeadOwner() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.isStaff, true))
    .orderBy(asc(users.name));
}

/**
 * Aggregate-stats voor /admin/leads bovenaan: per status het aantal.
 */
export async function getLeadStats() {
  const rows = await db
    .select({ status: leads.status, n: count() })
    .from(leads)
    .groupBy(leads.status);
  const out: Record<string, number> = {
    cold: 0,
    warmed: 0,
    booked: 0,
    met: 0,
    customer: 0,
    lost: 0,
  };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

/**
 * Dagelijks "wat staat er voor jou klaar"-overzicht — bundelt alles
 * waar Laurens actie op moet ondernemen, zodat de daily-digest-cron
 * (en eventueel een cockpit-widget) één bron heeft i.p.v. vijf losse
 * widgets. Bewust compact: alleen wat actie vraagt.
 */
export async function getDailyDigest() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const staleCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const leadDueCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Leads om vandaag/overdue op te volgen (nextActionAt <= morgen,
  //    nog niet customer/lost).
  const leadRows = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      company: leads.company,
      status: leads.status,
      nextActionAt: leads.nextActionAt,
      nextActionLabel: leads.nextActionLabel,
    })
    .from(leads)
    .where(
      and(
        isNotNull(leads.nextActionAt),
        lt(leads.nextActionAt, leadDueCutoff),
        ne(leads.status, "customer"),
        ne(leads.status, "lost"),
      ),
    )
    .orderBy(asc(leads.nextActionAt));

  // 2. Aankomende calls (komende 7 dagen).
  const callRows = await db
    .select({
      id: bookings.id,
      type: bookings.type,
      startsAt: bookings.startsAt,
      attendeeName: bookings.attendeeName,
      attendeeEmail: bookings.attendeeEmail,
      orgName: organizations.name,
    })
    .from(bookings)
    .innerJoin(organizations, eq(organizations.id, bookings.organizationId))
    .where(
      and(
        eq(bookings.status, "scheduled"),
        gte(bookings.startsAt, now),
        lt(bookings.startsAt, in7Days),
      ),
    )
    .orderBy(asc(bookings.startsAt));

  // 3. Intakes die ingevuld zijn (status submitted) — context voor de
  //    welcome-call. Pakken de meest recente 10.
  const intakeRows = await db
    .select({
      id: intakeResponses.id,
      orgId: intakeResponses.organizationId,
      orgName: organizations.name,
      submittedAt: intakeResponses.submittedAt,
    })
    .from(intakeResponses)
    .innerJoin(organizations, eq(organizations.id, intakeResponses.organizationId))
    .where(eq(intakeResponses.status, "submitted"))
    .orderBy(desc(intakeResponses.submittedAt))
    .limit(10);

  // 4. Projecten in 'review' (wachten op de handover-checklist).
  const reviewRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      orgId: projects.organizationId,
      orgName: organizations.name,
    })
    .from(projects)
    .innerJoin(organizations, eq(organizations.id, projects.organizationId))
    .where(eq(projects.status, "review"));

  // 5. Open high-priority tickets.
  const ticketRows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      orgId: tickets.organizationId,
      orgName: organizations.name,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(organizations, eq(organizations.id, tickets.organizationId))
    .where(and(eq(tickets.status, "open"), eq(tickets.priority, "high")))
    .orderBy(desc(tickets.createdAt));

  // 6. Stale build-projecten (actieve build-fase, geen update in 7 dagen).
  const activePhases = await db
    .select({
      projectId: buildPhases.projectId,
      projectName: projects.name,
      orgName: organizations.name,
    })
    .from(buildPhases)
    .innerJoin(organizations, eq(organizations.id, buildPhases.organizationId))
    .leftJoin(projects, eq(projects.id, buildPhases.projectId))
    .where(gt(buildPhases.endsAt, now));
  const staleProjects: Array<{ projectId: string; projectName: string; orgName: string }> = [];
  for (const p of activePhases) {
    if (!p.projectId || !p.projectName) continue;
    const last = await db
      .select({ createdAt: projectUpdates.createdAt })
      .from(projectUpdates)
      .where(eq(projectUpdates.projectId, p.projectId))
      .orderBy(desc(projectUpdates.createdAt))
      .limit(1);
    const lastAt = last[0]?.createdAt ?? null;
    if (!lastAt || lastAt < staleCutoff) {
      staleProjects.push({
        projectId: p.projectId,
        projectName: p.projectName,
        orgName: p.orgName,
      });
    }
  }

  return {
    leads: leadRows,
    upcomingCalls: callRows,
    submittedIntakes: intakeRows,
    projectsInReview: reviewRows,
    highPriorityTickets: ticketRows,
    staleProjects,
    hasAnything:
      leadRows.length > 0 ||
      callRows.length > 0 ||
      intakeRows.length > 0 ||
      reviewRows.length > 0 ||
      ticketRows.length > 0 ||
      staleProjects.length > 0,
  };
}
