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
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- enums ---------------------------------------------------------------

export const localeEnum = pgEnum("locale", ["nl", "es"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "member", "read_only"]);
export const orgCountryEnum = pgEnum("org_country", ["NL", "ES"]);
export const planEnum = pgEnum("plan", ["basic", "pro", "partner"]);
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

// --- relations -----------------------------------------------------------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(users),
  projects: many(projects),
  tickets: many(tickets),
  invoices: many(invoices),
  subscriptions: many(subscriptions),
  files: many(files),
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
