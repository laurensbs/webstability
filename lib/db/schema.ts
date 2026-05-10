import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  pgEnum,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- enums ---------------------------------------------------------------

export const localeEnum = pgEnum("locale", ["nl", "es"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "member", "read_only"]);
export const orgCountryEnum = pgEnum("org_country", ["NL", "ES"]);
export const planEnum = pgEnum("plan", ["care", "studio", "atelier"]);
export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_progress",
  "review",
  "live",
  "done",
]);
export const projectTypeEnum = pgEnum("project_type", [
  "care",
  "build",
  "website",
  "webshop",
  "system",
  "seo",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting",
  "closed",
]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["bug", "feature", "question"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
  "incomplete",
]);
export const monitoringStatusEnum = pgEnum("monitoring_status", ["up", "degraded", "down"]);
export const buildExtensionEnum = pgEnum("build_extension", ["light", "standard", "custom"]);
export const incidentTypeEnum = pgEnum("incident_type", ["incident", "maintenance"]);
export const fileCategoryEnum = pgEnum("file_category", [
  "contract",
  "asset",
  "deliverable",
  "report",
]);

// --- organizations -------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  vatNumber: text("vat_number"),
  country: orgCountryEnum("country").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  mollieCustomerId: text("mollie_customer_id"),
  plan: planEnum("plan"),
  planStartedAt: timestamp("plan_started_at", { withTimezone: true }),
  /** VIP-flag — staff kan klanten markeren voor extra zorg. Toont een
   * wijn-rode tag in alle admin-lijsten en kan in de toekomst worden
   * gebruikt om SLA-prioriteit of premium support af te leiden. */
  isVip: boolean("is_vip").notNull().default(false),
  /** Demo-flag — markeert de seed-org die publiek toegankelijk is via
   * /demo/portal en /demo/admin. Demo-data wordt nooit gemuteerd door
   * server-actions (zie lib/demo-guard.ts). Slechts één row tegelijk in
   * productie verwacht; meerdere kan voor lokaal testen. */
  isDemo: boolean("is_demo").notNull().default(false),
  /** Lifecycle-markers voor de fase 1 onboarding-flow. `intakeCompletedAt`
   * wordt gezet bij submitIntakeForm; we leiden er ook de redirect-logica
   * van af (geen intake = stuur naar /portal/intake i.p.v. dashboard).
   * `contractSignedAt` is fase-3 en blijft nullable tot DocuSeal wired is. */
  intakeCompletedAt: timestamp("intake_completed_at", { withTimezone: true }),
  contractSignedAt: timestamp("contract_signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// --- users (Auth.js + app fields) ----------------------------------------
// Shape follows @auth/drizzle-adapter requirements; we add app columns.

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  // App columns:
  locale: localeEnum("locale").notNull().default("nl"),
  role: userRoleEnum("role").notNull().default("member"),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  twoFactorSecret: text("two_factor_secret"),
  // Studio-side staff flag — orthogonal to org `role`. Studio staff can see
  // the cross-org /admin views; clients cannot, regardless of their own role.
  isStaff: boolean("is_staff").notNull().default(false),
  /** Demo-flag — markeert de seed-users (demo-portal en demo-admin) die
   * via /demo/portal en /demo/admin inloggen zonder magic-link. Mutaties
   * door deze users worden gevangen in lib/demo-guard.ts en als no-op
   * teruggegeven met toast "Demo-mode". */
  isDemo: boolean("is_demo").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// --- Auth.js adapter tables ----------------------------------------------

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// --- projects ------------------------------------------------------------

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: projectTypeEnum("type").notNull(),
    status: projectStatusEnum("status").notNull().default("planning"),
    progress: integer("progress").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    githubRepoUrl: text("github_repo_url"),
    vercelProjectId: text("vercel_project_id"),
    monitoringTargetUrl: text("monitoring_target_url"),
    /** Tijdstempel van het moment dat status flipt naar 'live'. Wordt
     * automatisch gezet door updateProject() als status van iets-anders
     * naar 'live' gaat én liveAt nog null is. Klant-portal gebruikt dit
     * om binnen 7 dagen na livegang een sparkle-banner te tonen. */
    liveAt: timestamp("live_at", { withTimezone: true }),
    /** Korte zin die staff per week update — toont op /portal/projects/
     * [id] als 'volgende mijlpaal'. Vrij tekstveld zodat staff er
     * naar wens iets in kan zetten ('Klantportaal-skelet klaar voor
     * jouw review'). Geen audit-log nodig per wijziging. */
    nextMilestone: text("next_milestone"),
    nextMilestoneUpdatedAt: timestamp("next_milestone_updated_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("projects_org_idx").on(t.organizationId)],
);

// --- tickets -------------------------------------------------------------

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    priority: ticketPriorityEnum("priority").notNull().default("normal"),
    status: ticketStatusEnum("status").notNull().default("open"),
    /** Klant-input bij aanmaak: bug | feature | question. Auto-mapt
     * naar priority bij de createTicket-action: bug=high, feature=normal,
     * question=low. */
    category: ticketCategoryEnum("category").notNull().default("question"),
    /** True als de klant zijn tier-budget heeft overschreden bij aanmaak.
     * Niet blocking — geeft staff context bij triage. */
    overBudget: boolean("over_budget").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [index("tickets_org_status_idx").on(t.organizationId, t.status)],
);

export const ticketReplies = pgTable(
  "ticket_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<{ name: string; url: string; size: number }[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("ticket_replies_ticket_idx").on(t.ticketId)],
);

// --- invoices ------------------------------------------------------------

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: text("number").notNull().unique(),
    amount: integer("amount").notNull(), // cents
    vatAmount: integer("vat_amount").notNull(), // cents
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    stripeInvoiceId: text("stripe_invoice_id"),
    mollieInvoiceId: text("mollie_invoice_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("invoices_org_idx").on(t.organizationId)],
);

// --- subscriptions -------------------------------------------------------

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  mollieSubscriptionId: text("mollie_subscription_id"),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// --- monitoring ----------------------------------------------------------

export const monitoringChecks = pgTable(
  "monitoring_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    status: monitoringStatusEnum("status").notNull(),
    responseTimeMs: integer("response_time_ms"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("monitoring_project_time_idx").on(t.projectId, t.checkedAt)],
);

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  severity: text("severity"),
  summary: text("summary"),
  type: incidentTypeEnum("type").notNull().default("incident"),
});

// --- files ---------------------------------------------------------------

export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    blobPath: text("blob_path").notNull(),
    category: fileCategoryEnum("category").notNull(),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("files_org_idx").on(t.organizationId)],
);

// --- seo_reports ---------------------------------------------------------

export const seoReports = pgTable("seo_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  data: jsonb("data").$type<{
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: { query: string; clicks: number; impressions: number }[];
  }>(),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// --- build_phases --------------------------------------------------------
//
// Een actieve Build-extension (Light/Standard/Custom) per organisatie.
// Een org heeft typisch 0 of 1 actieve build-fase tegelijk; multipele
// rijen betekenen historische builds. start/end zijn de afgesproken
// looptijd; project-id linkt optioneel naar het hoofdproject dat in
// die periode wordt opgeleverd. We slaan dit los van de Stripe-
// subscription op zodat staff ook handmatig kan toevoegen voor klanten
// die nog niet via Stripe lopen.
export const buildPhases = pgTable(
  "build_phases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    extension: buildExtensionEnum("extension").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    /** Geplande einddatum — wordt op create gezet o.b.v. duration_months. */
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    /** Bouwperiode in maanden, zoals afgesproken (2-8). */
    durationMonths: integer("duration_months").notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    /** Korte naam van wat we bouwen ('verhuurplatform', 'webshop'). */
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("build_phase_org_active_idx").on(t.organizationId, t.endsAt)],
);

// --- hours_logged --------------------------------------------------------
//
// Per-org log van werk-uren dat staff heeft besteed in een specifieke
// kalendermaand. Een Care-klant heeft 1u/m budget, Studio 3u, Atelier
// 8u. We schrijven elke werk-sessie weg als een rij; het portal-widget
// somt op naar "X van Y uur gebruikt deze maand". Geen extra tabel
// voor budgets nodig — die volgt uit de organisations.plan kolom +
// een hardcoded mapping in lib.
export const hoursLogged = pgTable(
  "hours_logged",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** ISO-datum (YYYY-MM-DD) waarop het werk is gedaan. */
    workedOn: timestamp("worked_on", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    /** Tijdsinvestering in minuten — schaalt netter dan kwartieren. */
    minutes: integer("minutes").notNull(),
    /** Korte omschrijving die de klant ook ziet ('Security update Q2',
     * 'SEO meta-titles aangepast', 'Boekingsformulier gefixt'). */
    description: text("description").notNull(),
    /** Welk project (optioneel) — kan leeg blijven voor algemeen werk. */
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    /** Wie het uur logde — de staff member. */
    loggedBy: text("logged_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("hours_org_worked_idx").on(t.organizationId, t.workedOn)],
);

// --- discounts -----------------------------------------------------------
//
// Audit-trail van toegekende kortingen per organisatie. Elke rij wijst
// naar een Stripe coupon (server-side gemaakt via stripe.coupons.create)
// die op een subscription is toegepast. We bewaren reden + grantedBy zodat
// later inzichtelijk is waarom een klant korting kreeg, ook als de
// Stripe-coupon zelf is verlopen of opgezegd.
export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stripeCouponId: text("stripe_coupon_id"),
    /** Korting in procent (5–100). 100 = gratis. */
    percentOff: integer("percent_off").notNull(),
    /** Voor hoeveel maanden de korting geldt. Null = forever. */
    monthsApplied: integer("months_applied"),
    reason: text("reason").notNull(),
    grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("discounts_org_idx").on(t.organizationId, t.createdAt)],
);

// --- demo_events ---------------------------------------------------------
//
// Lichtgewicht funnel-tracking voor de live-demo. We bewaren géén
// volledige IPs (privacy) — alleen een SHA-256 hash voor uniqueness
// detectie. De `kind` enum dekt de hele funnel: entered (welke ingang),
// tour_completed/dismissed, cta_clicked (in demo-banner = gold),
// session_ended (cookie-expire of dismiss). Source vertelt welke
// marketing-ingang gebruikt is.
export const demoEventKindEnum = pgEnum("demo_event_kind", [
  "entered",
  "tour_completed",
  "tour_dismissed",
  "cta_clicked",
  "session_ended",
]);

export const demoEvents = pgTable(
  "demo_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: demoEventKindEnum("kind").notNull(),
    /** Bv. 'hero', 'cases', 'pricing', 'banner_cta', 'tour_step_3'. */
    source: text("source"),
    /** Welke role: portal | admin (alleen relevant voor entered/tour). */
    role: text("role"),
    userAgent: text("user_agent"),
    /** SHA-256 hash van het IP-adres + dag — voor coarse-grained
     * uniqueness binnen 24u zonder volle IP op te slaan. */
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("demo_events_kind_time_idx").on(t.kind, t.createdAt)],
);

// --- staff_invites -------------------------------------------------------
//
// Token-based invite voor het toevoegen van extra studio-staff zonder
// directe DB-toegang. Een staff-member maakt een invite (creates row +
// stuurt mail), de invitee opent de magic-link, NextAuth maakt user-row,
// en in de auth-callback (lib/auth.ts events.signIn) zoeken we matchende
// invite op email — als die bestaat en niet expired, set isStaff=true en
// markeer invite als accepted. Na 7 dagen vervalt de invite zonder
// gebruik.
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("staff_invites_email_idx").on(t.email)],
);

// --- audit_log -----------------------------------------------------------

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("audit_org_time_idx").on(t.organizationId, t.createdAt)],
);

// --- intake_responses + bookings (fase 1 lifecycle) -----------------------

export const intakeStatusEnum = pgEnum("intake_status", ["draft", "submitted"]);

/**
 * Antwoorden op het 8-stappen intake-form. `answers` is een free-form
 * jsonb-blob zodat de form-shape kan evolueren zonder schema-migraties.
 * Eén row per organization. Status `draft` betekent klant heeft
 * 'sla op en sluit' gedaan; `submitted` triggert project-spawn.
 */
export const intakeResponses = pgTable(
  "intake_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" })
      .unique(),
    answers: jsonb("answers").notNull().$type<Record<string, unknown>>(),
    status: intakeStatusEnum("status").notNull().default("draft"),
    /** Welke stap is de klant tot waar (1-8) — klant kan terugkomen
     * en verder vullen waar 'ie was. */
    currentStep: integer("current_step").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("intake_org_idx").on(t.organizationId)],
);

export const bookingTypeEnum = pgEnum("booking_type", [
  "welcome_call",
  "review_call",
  "strategy_call",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
]);

/**
 * Cal.com-bookings gekoppeld aan een organization (via email-match in
 * de webhook of via de submitIntakeForm-flow voor de eerste call).
 * Houdt bij wat er gepland is, wanneer, en of het is afgerond.
 *
 * Fase 1 schrijft hier alleen vanuit submitIntakeForm; fase 2 voegt
 * de Cal-webhook toe die updates pusht.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: bookingTypeEnum("type").notNull(),
    /** Cal.com booking-id (uit webhook) of null als handmatig
     * aangemaakt vóór de webhook geconfigureerd is. */
    calMeetingId: text("cal_meeting_id"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: bookingStatusEnum("status").notNull().default("scheduled"),
    attendeeEmail: text("attendee_email"),
    attendeeName: text("attendee_name"),
    /** Cal-link of meeting-URL (Zoom/Google Meet) als die uit de
     * webhook komt. Voor handmatige bookings: null. */
    meetingUrl: text("meeting_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("bookings_org_starts_idx").on(t.organizationId, t.startsAt),
    index("bookings_starts_idx").on(t.startsAt),
  ],
);

// --- project_updates (sprint B — wekelijkse build-stand-van-zaken) -------

/**
 * Korte staff-update op een project — verschijnt op /portal/projects/[id]
 * voor de klant en in de wekelijkse update-mail. Markdown-tekst, geen
 * versies. Cron 'weekly-update' bundelt alle entries van de afgelopen
 * 7 dagen in één mail.
 */
export const projectUpdates = pgTable(
  "project_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    postedBy: text("posted_by").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("project_updates_project_time_idx").on(t.projectId, t.createdAt),
    index("project_updates_org_time_idx").on(t.organizationId, t.createdAt),
  ],
);

// --- relations -----------------------------------------------------------

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  members: many(users),
  projects: many(projects),
  tickets: many(tickets),
  invoices: many(invoices),
  subscriptions: many(subscriptions),
  files: many(files),
  intakeResponse: one(intakeResponses, {
    fields: [organizations.id],
    references: [intakeResponses.organizationId],
  }),
  bookings: many(bookings),
}));

export const intakeResponsesRelations = relations(intakeResponses, ({ one }) => ({
  organization: one(organizations, {
    fields: [intakeResponses.organizationId],
    references: [organizations.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  organization: one(organizations, {
    fields: [bookings.organizationId],
    references: [organizations.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  tickets: many(tickets),
  ticketReplies: many(ticketReplies),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  tickets: many(tickets),
  monitoringChecks: many(monitoringChecks),
  incidents: many(incidents),
  updates: many(projectUpdates),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [projectUpdates.organizationId],
    references: [organizations.id],
  }),
  postedByUser: one(users, {
    fields: [projectUpdates.postedBy],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
  project: one(projects, { fields: [tickets.projectId], references: [projects.id] }),
  replies: many(ticketReplies),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketReplies.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketReplies.userId], references: [users.id] }),
}));

export const hoursLoggedRelations = relations(hoursLogged, ({ one }) => ({
  organization: one(organizations, {
    fields: [hoursLogged.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, { fields: [hoursLogged.projectId], references: [projects.id] }),
  loggedByUser: one(users, { fields: [hoursLogged.loggedBy], references: [users.id] }),
}));

export const buildPhasesRelations = relations(buildPhases, ({ one }) => ({
  organization: one(organizations, {
    fields: [buildPhases.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, { fields: [buildPhases.projectId], references: [projects.id] }),
}));
