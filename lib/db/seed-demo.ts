// Demo-seed — idempotent. Run via `pnpm db:seed:demo`.
//
// Strategie: vind alle organizations met isDemo=true, drop ze cascade
// (alle child-rijen verdwijnen automatisch via FK ON DELETE CASCADE).
// Daarna vol vers inserteren. Geen ENV-check; dit script is opt-in.
//
// Eindresultaat: één "Costa Caravans Verhuur" org + 2 demo-users
// (Marco Jansen als owner — zelfde naam als de testimonial op /verhuur,
// staff "Studio") + levensechte data. Naamkeuze = bewust: prospect die
// op /verhuur de quote leest en daarna de demo opent ziet hetzelfde
// bedrijf, dat versterkt het herkenbaarheidsmoment.
//
// Het verhuurproject staat op liveAt = daysAgo(120) → triggert de
// ReferralCard (≥90d live) zodat het mechanisme zichtbaar is. Het
// tweede project loopt nog (build-fase actief).

import { db } from "./index";
import {
  organizations,
  users,
  projects,
  tickets,
  ticketReplies,
  invoices,
  subscriptions,
  hoursLogged,
  buildPhases,
  monitoringChecks,
  incidents,
  discounts,
  staffInvites,
  auditLog,
} from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const DEMO_ORG_SLUG = "demo-costa-caravans";
const DEMO_PORTAL_EMAIL = "demo-portal@webstability.eu";
const DEMO_ADMIN_EMAIL = "demo-admin@webstability.eu";

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY);
}
function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * MIN);
}

async function dropExisting() {
  // Find demo orgs (kan er meerdere zijn bij testen).
  const demoOrgs = await db.query.organizations.findMany({
    where: eq(organizations.isDemo, true),
    columns: { id: true },
  });
  for (const o of demoOrgs) {
    // Cascade-FK ruimt projects/tickets/etc op; expliciet de adapter-
    // verwijzingen (hoursLogged, buildPhases, files, audit_log) zijn
    // ook ON DELETE CASCADE voor organizationId. Users zijn niet
    // org-cascade — die schoonmaken we apart.
    await db.delete(organizations).where(eq(organizations.id, o.id));
    console.log(`demo-seed: removed org ${o.id}`);
  }
  // Demo-users staan los van org (organizationId nullable). Ruim apart.
  const demoUsers = await db.query.users.findMany({
    where: eq(users.isDemo, true),
    columns: { id: true },
  });
  for (const u of demoUsers) {
    await db.delete(users).where(eq(users.id, u.id));
  }
  if (demoUsers.length > 0) {
    console.log(`demo-seed: removed ${demoUsers.length} demo-user(s)`);
  }
}

async function main() {
  console.log("demo-seed: starting…");
  await dropExisting();

  // === Org ===
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Costa Caravans Verhuur",
      slug: DEMO_ORG_SLUG,
      country: "ES",
      vatNumber: "ESB12345678",
      plan: "studio",
      planStartedAt: daysAgo(412),
      isVip: true,
      isDemo: true,
    })
    .returning({ id: organizations.id });
  console.log(`demo-seed: org ${org.id}`);

  // === Users ===
  const portalUserId = randomUUID();
  await db.insert(users).values({
    id: portalUserId,
    email: DEMO_PORTAL_EMAIL,
    name: "Marco Jansen",
    emailVerified: daysAgo(412),
    locale: "nl",
    role: "owner",
    organizationId: org.id,
    isStaff: false,
    isDemo: true,
    lastLoginAt: minutesAgo(12),
    createdAt: daysAgo(412),
  });

  const adminUserId = randomUUID();
  await db.insert(users).values({
    id: adminUserId,
    email: DEMO_ADMIN_EMAIL,
    name: "Studio (demo)",
    emailVerified: daysAgo(180),
    locale: "nl",
    role: "owner",
    organizationId: null,
    isStaff: true,
    isDemo: true,
    lastLoginAt: minutesAgo(3),
    createdAt: daysAgo(200),
  });
  console.log(`demo-seed: 2 users`);

  // === Projects ===
  // Verhuurplatform: live sinds 412 dagen — triggert de ReferralCard
  // (≥90 dagen live + geen recente livegang-celebration). Demo-bezoeker
  // ziet daarmee dat het referral-mechanisme bestaat.
  const [verhuurproject] = await db
    .insert(projects)
    .values({
      organizationId: org.id,
      name: "Boekingsplatform v2",
      type: "build",
      status: "live",
      progress: 100,
      startedAt: daysAgo(450),
      liveAt: daysAgo(412),
      monitoringTargetUrl: "https://costacaravans.example",
    })
    .returning({ id: projects.id });

  const [reparatieProject] = await db
    .insert(projects)
    .values({
      organizationId: org.id,
      name: "Klantenportaal — boekingsoverzicht",
      type: "system",
      status: "in_progress",
      progress: 65,
      startedAt: daysAgo(45),
      dueAt: daysFromNow(47),
    })
    .returning({ id: projects.id });

  await db.insert(projects).values({
    organizationId: org.id,
    name: "Admin redesign Q3",
    type: "build",
    status: "planning",
    progress: 10,
    startedAt: daysAgo(7),
    dueAt: daysFromNow(120),
  });
  console.log(`demo-seed: 3 projects`);

  // === Build phase ===
  await db.insert(buildPhases).values({
    organizationId: org.id,
    extension: "standard",
    label: "Klantenportaal — boekingsoverzicht + self-service",
    startedAt: daysAgo(45),
    endsAt: daysFromNow(47),
    durationMonths: 4,
    projectId: reparatieProject.id,
  });
  console.log(`demo-seed: 1 buildPhase`);

  // === Hours logged ===
  const hourEntries: Array<{ minutes: number; description: string; daysBack: number }> = [
    { minutes: 45, description: "Stripe-coupon voor seizoen-korting toegepast", daysBack: 1 },
    { minutes: 90, description: "Boekingsformulier mobile-fix iPhone Safari", daysBack: 2 },
    { minutes: 30, description: "DNS-records gecheckt voor MX wijziging", daysBack: 4 },
    { minutes: 120, description: "iPad-flow voor monteurs uitgewerkt + getest", daysBack: 5 },
    { minutes: 60, description: "Lokale SEO meta-titles ES versie", daysBack: 8 },
    { minutes: 90, description: "Kanaal-sync Booking.com debugged", daysBack: 11 },
  ];
  for (const h of hourEntries) {
    await db.insert(hoursLogged).values({
      organizationId: org.id,
      workedOn: daysAgo(h.daysBack),
      minutes: h.minutes,
      description: h.description,
      projectId: h.daysBack < 6 ? reparatieProject.id : verhuurproject.id,
      loggedBy: adminUserId,
    });
  }
  console.log(`demo-seed: ${hourEntries.length} hour entries`);

  // === Tickets ===
  const [ticketBug] = await db
    .insert(tickets)
    .values({
      organizationId: org.id,
      userId: portalUserId,
      projectId: verhuurproject.id,
      subject: "Boekingsformulier doet niks op iPhone",
      body: "Klanten melden dat ze op iPhone Safari de boek-knop indrukken en er gebeurt niks. Werkt wel op Android. Kun je hier even naar kijken? Twee meldingen vandaag al.",
      priority: "high",
      status: "open",
      category: "bug",
      overBudget: false,
      createdAt: daysAgo(1),
    })
    .returning({ id: tickets.id });

  const [ticketFeature] = await db
    .insert(tickets)
    .values({
      organizationId: org.id,
      userId: portalUserId,
      subject: "Kanaal-sync met Vrbo toevoegen",
      body: "We willen ook gaan publiceren op Vrbo. Kun je een sync inrichten zoals we nu hebben met Booking.com en Airbnb? Hoe lang duurt dat ongeveer?",
      priority: "normal",
      status: "in_progress",
      category: "feature",
      overBudget: false,
      createdAt: daysAgo(5),
    })
    .returning({ id: tickets.id });

  await db.insert(tickets).values({
    organizationId: org.id,
    userId: portalUserId,
    subject: "Hoe stel ik vakantieperiode in?",
    body: "Ik wil twee weken niet beschikbaar zijn voor boekingen. Kan dat via het admin-paneel of moet ik dat per caravan apart doen?",
    priority: "low",
    status: "waiting",
    category: "question",
    overBudget: false,
    createdAt: daysAgo(2),
  });

  await db.insert(tickets).values({
    organizationId: org.id,
    userId: portalUserId,
    subject: "BTW/IVA-rounding: 21% afronding klopt niet op grote bedragen",
    body: "Op een factuur van €4.250 staat €892,50 IVA, maar de boekhouder rekent €892,52. Lijkt een afrondings-issue tussen jullie systeem en Holded. Kun je kijken welke regel toegepast moet worden?",
    priority: "normal",
    status: "open",
    category: "bug",
    overBudget: false,
    createdAt: daysAgo(3),
  });

  await db.insert(tickets).values({
    organizationId: org.id,
    userId: portalUserId,
    subject: "Webshop-mobile fix: voucher-veld zichtbaar op iPhone SE",
    body: "Op de oudere iPhone SE valt het kortingsvoucher-veld buiten het scherm. We krijgen melding dat klanten de checkout afbreken. Kan dat snel?",
    priority: "high",
    status: "open",
    category: "bug",
    overBudget: false,
    createdAt: minutesAgo(120),
  });

  await db.insert(tickets).values({
    organizationId: org.id,
    userId: portalUserId,
    subject: "Email-template typo 'reservering bevesteigd'",
    body: "Kleine typo in de bevestigings-email. Moet 'bevestigd' zijn.",
    priority: "low",
    status: "closed",
    category: "bug",
    overBudget: false,
    createdAt: daysAgo(14),
    closedAt: daysAgo(13),
  });

  await db.insert(tickets).values({
    organizationId: org.id,
    userId: portalUserId,
    subject: "Kunnen we facturen ook in Engels?",
    body: "Veel internationale klanten — handig als de invoice-PDF ook in EN beschikbaar is.",
    priority: "low",
    status: "open",
    category: "question",
    overBudget: true,
    createdAt: minutesAgo(45),
  });
  console.log(`demo-seed: 7 tickets`);

  // === Ticket replies ===
  await db.insert(ticketReplies).values({
    ticketId: ticketBug.id,
    userId: adminUserId,
    body: "Bedankt voor de melding — ik kan het reproduceren op iPhone 15 Safari. Lijkt op een touch-event-bug in de form-validatie. Fix komt vandaag nog. Stuur straks update.",
    createdAt: minutesAgo(35),
  });

  await db.insert(ticketReplies).values({
    ticketId: ticketFeature.id,
    userId: adminUserId,
    body: "Vrbo heeft een iCal-API én een directe partner-API. iCal is sneller (1 week), partner-API geeft real-time updates en pricing-sync (3-4 weken). Wat heeft prioriteit?",
    createdAt: daysAgo(4),
  });

  await db.insert(ticketReplies).values({
    ticketId: ticketFeature.id,
    userId: portalUserId,
    body: "Begin maar met iCal voor snelheid. Real-time kan in een volgende build.",
    createdAt: daysAgo(3),
  });
  console.log(`demo-seed: 3 ticket replies`);

  // === Invoices ===
  const stamp = Date.now().toString().slice(-6);
  await db.insert(invoices).values({
    organizationId: org.id,
    number: `WS-${stamp}-001`,
    amount: 17900,
    vatAmount: 3759,
    currency: "EUR",
    status: "paid",
    dueAt: daysAgo(15),
    paidAt: daysAgo(12),
    createdAt: daysAgo(30),
  });
  await db.insert(invoices).values({
    organizationId: org.id,
    number: `WS-${stamp}-002`,
    amount: 17900,
    vatAmount: 3759,
    currency: "EUR",
    status: "sent",
    dueAt: daysFromNow(8),
    createdAt: daysAgo(2),
  });
  await db.insert(invoices).values({
    organizationId: org.id,
    number: `WS-${stamp}-003`,
    amount: 49900,
    vatAmount: 10479,
    currency: "EUR",
    status: "draft",
    dueAt: daysFromNow(30),
    createdAt: minutesAgo(120),
  });
  console.log(`demo-seed: 3 invoices`);

  // === Subscription ===
  await db.insert(subscriptions).values({
    organizationId: org.id,
    plan: "studio",
    status: "active",
    currentPeriodEnd: daysFromNow(23),
    stripeSubscriptionId: "sub_demo_studio",
    createdAt: daysAgo(180),
  });
  console.log(`demo-seed: 1 subscription`);

  // === Monitoring checks (verspreid over laatste 7 dagen) ===
  for (let i = 0; i < 200; i++) {
    const checkedAt = new Date(Date.now() - i * 30 * MIN);
    // 95% up, 4% degraded, 1% down voor realistische uptime-graph
    const r = Math.random();
    const status = r < 0.95 ? "up" : r < 0.99 ? "degraded" : "down";
    const responseTimeMs =
      status === "up"
        ? 120 + Math.floor(Math.random() * 200)
        : status === "degraded"
          ? 800 + Math.floor(Math.random() * 1500)
          : null;
    await db.insert(monitoringChecks).values({
      projectId: verhuurproject.id,
      targetUrl: "https://costacaravans.example",
      status,
      responseTimeMs,
      checkedAt,
    });
  }
  console.log(`demo-seed: 200 monitoring checks`);

  // === Active incident ===
  await db.insert(incidents).values({
    projectId: verhuurproject.id,
    startedAt: minutesAgo(40),
    summary: "Reactietijden boven 2s — onderzoeken DB-pool",
    severity: "high",
    type: "incident",
  });
  console.log(`demo-seed: 1 active incident`);

  // === Discounts (historie) ===
  await db.insert(discounts).values({
    organizationId: org.id,
    stripeCouponId: "coupon_demo_loyaliteit",
    percentOff: 20,
    monthsApplied: 3,
    reason: "Loyaliteitsbonus — 6 maanden Studio zonder issues",
    grantedBy: adminUserId,
    createdAt: daysAgo(60),
  });
  await db.insert(discounts).values({
    organizationId: org.id,
    stripeCouponId: "coupon_demo_storing_nov",
    percentOff: 10,
    monthsApplied: null,
    reason: "Compensatie storing november — forever",
    grantedBy: adminUserId,
    createdAt: daysAgo(180),
  });
  console.log(`demo-seed: 2 discounts`);

  // === Expired pending invite (zodat /admin/team listing zichtbaar is) ===
  await db.insert(staffInvites).values({
    email: "collega-die-nooit-kwam@webstability.eu",
    token: randomUUID(),
    invitedBy: adminUserId,
    expiresAt: daysAgo(1),
    createdAt: daysAgo(8),
  });
  console.log(`demo-seed: 1 expired invite`);

  // === Audit-log ===
  const auditEvents: Array<{ action: string; daysBack: number; metadata?: object }> = [
    { action: "project.live", daysBack: 412, metadata: { name: "Boekingsplatform v2" } },
    {
      action: "discount.granted",
      daysBack: 60,
      metadata: { percentOff: 20, monthsApplied: 3 },
    },
    { action: "subscription.plan_changed", daysBack: 120, metadata: { newPlan: "studio" } },
    { action: "org.vip_set", daysBack: 90, metadata: {} },
    { action: "ticket.opened", daysBack: 5, metadata: { subject: "Kanaal-sync Vrbo" } },
    { action: "build_phase.started", daysBack: 45, metadata: { extension: "standard" } },
    { action: "hours.logged", daysBack: 1, metadata: { minutes: 45 } },
    { action: "subscription.paused", daysBack: 200, metadata: { months: 1 } },
  ];
  for (const e of auditEvents) {
    await db.insert(auditLog).values({
      organizationId: org.id,
      userId: adminUserId,
      action: e.action,
      targetType: "demo",
      metadata: e.metadata,
      createdAt: daysAgo(e.daysBack),
    });
  }
  console.log(`demo-seed: ${auditEvents.length} audit-events`);

  console.log("demo-seed: done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
