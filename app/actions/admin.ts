"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendStaffInvite } from "@/lib/email/staff-invite";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { DemoReadonlyError } from "@/lib/demo-guard";
import {
  changeSubscriptionPlan,
  pauseStripeSubscription,
  resumeStripeSubscription,
  cancelStripeSubscription,
  applyDiscountCoupon,
  isStripeConfigured,
} from "@/lib/stripe";
import { put } from "@vercel/blob";
import {
  users,
  projects,
  tickets,
  hoursLogged,
  organizations,
  buildPhases,
  staffInvites,
  discounts,
  subscriptions,
  invoices,
  files,
  auditLog,
  projectUpdates,
  handoverChecklist,
  leads,
  leadActivity,
  ticketReplies,
} from "@/lib/db/schema";
import { getHandoverStatus } from "@/lib/db/queries/portal";
import type { ActionResult } from "@/lib/action-result";

// Per-request cached lookup — voorkomt dat een server-action die meerdere
// staff-checks doet (bv. logHours + revalidatePath) twee identieke
// SELECT queries doet.
const fetchStaffUser = cache(async (sessionUserId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, sessionUserId),
    columns: { id: true, isStaff: true, isDemo: true },
  });
});

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await fetchStaffUser(session.user.id);
  if (!user?.isStaff) throw new Error("forbidden");
  // Demo-staff mag alleen lezen — write-guard hier zodat álle actions
  // die requireStaff() aanroepen automatisch beschermd zijn. Throw een
  // DemoReadonlyError; de catch-blok in elke action vangt 'm af en
  // geeft een succesvolle ActionResult met messageKey 'demo_readonly'.
  if (user.isDemo) throw new DemoReadonlyError();
  return { userId: user.id };
}

/**
 * Centrale catch-helper voor server-actions die requireStaff() doen.
 * Onderscheidt DemoReadonlyError (success-toast met demo_readonly) van
 * gewone forbidden/unauthorized errors. Hergebruikt door alle 17 catch-
 * blokken zodat de boilerplate niet 17× doodgewicht is.
 */
function handleAuthError(e: unknown): ActionResult {
  if (e instanceof DemoReadonlyError) {
    return { ok: true, messageKey: "demo_readonly" };
  }
  return { ok: false, messageKey: "forbidden" };
}

const PROJECT_STATUSES = ["planning", "in_progress", "review", "live", "done"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export async function updateProject(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const statusInput = String(formData.get("status") ?? "");
  const progressInput = Number(formData.get("progress") ?? 0);
  const urlInput = String(formData.get("url") ?? "").trim();
  const status = PROJECT_STATUSES.includes(statusInput as ProjectStatus)
    ? (statusInput as ProjectStatus)
    : null;
  if (!status) return { ok: false, messageKey: "missing_fields" };

  const progress = Math.max(0, Math.min(100, Math.round(progressInput)));

  // Livegang-detectie: als de status nu flipt naar 'live' en liveAt
  // nog null is, set 'm. Stuurt mail naar org-owner + audit-log entry.
  // Doen we vóór de update zodat we de oude status kunnen vergelijken.
  const current = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      status: true,
      liveAt: true,
      organizationId: true,
      name: true,
      monitoringTargetUrl: true,
    },
  });
  const becomesLive = current && status === "live" && !current.liveAt;
  const liveAt = becomesLive ? new Date() : undefined;

  await db
    .update(projects)
    .set({
      status,
      progress,
      monitoringTargetUrl: urlInput || null,
      ...(liveAt ? { liveAt } : {}),
    })
    .where(eq(projects.id, projectId));

  if (becomesLive && current) {
    await db.insert(auditLog).values({
      organizationId: current.organizationId,
      userId,
      action: "project.live",
      targetType: "project",
      targetId: projectId,
      metadata: { name: current.name, url: urlInput || current.monitoringTargetUrl || null },
    });

    // Stuur livegang-mail naar org-owner. Faalt graceful — admin kan
    // sowieso de banner zien op portal-dashboard.
    try {
      const owner = await db.query.users.findFirst({
        where: and(eq(users.organizationId, current.organizationId), eq(users.role, "owner")),
        columns: { email: true, name: true, locale: true },
      });
      if (owner?.email) {
        const { sendLivegangMail } = await import("@/lib/email/livegang");
        await sendLivegangMail({
          to: owner.email,
          name: owner.name ?? null,
          projectName: current.name,
          projectUrl: urlInput || current.monitoringTargetUrl || null,
          locale: owner.locale === "es" ? "es" : "nl",
        });
      }
    } catch (err) {
      console.error("[admin] livegang mail failed:", err);
    }
  }

  revalidatePath(`/admin`);
  revalidatePath(`/admin/orgs`);
  revalidatePath(`/admin/orgs/${current?.organizationId ?? ""}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

const TICKET_STATUSES = ["open", "in_progress", "waiting", "closed"] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

export async function updateTicketStatus(
  ticketId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const statusInput = String(formData.get("status") ?? "");
  const status = TICKET_STATUSES.includes(statusInput as TicketStatus)
    ? (statusInput as TicketStatus)
    : null;
  if (!status) return { ok: false, messageKey: "missing_fields" };

  await db
    .update(tickets)
    .set({
      status,
      closedAt: status === "closed" ? new Date() : null,
    })
    .where(eq(tickets.id, ticketId));

  revalidatePath(`/admin/tickets`);
  revalidatePath(`/portal/tickets/${ticketId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Log uren voor een organisatie. Aangeroepen door staff vanuit de
 * admin org-detail pagina. minutes is het aantal minuten besteed,
 * description komt mee als changelog-regel die de klant ook ziet.
 */
export async function logHours(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const minutes = Number(formData.get("minutes") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  const workedOnRaw = String(formData.get("workedOn") ?? "").trim();

  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 8 * 60) {
    return { ok: false, messageKey: "missing_fields" };
  }
  if (!description) return { ok: false, messageKey: "missing_fields" };

  await db.insert(hoursLogged).values({
    organizationId,
    minutes: Math.round(minutes),
    description,
    projectId: projectIdRaw || null,
    loggedBy: userId,
    workedOn: workedOnRaw ? new Date(workedOnRaw) : new Date(),
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

// --- Org-management ------------------------------------------------------

const PLAN_VALUES = ["care", "studio", "atelier"] as const;
type Plan = (typeof PLAN_VALUES)[number];
const COUNTRY_VALUES = ["NL", "ES"] as const;
type Country = (typeof COUNTRY_VALUES)[number];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Maak een nieuwe klant-organisatie aan vanuit het admin-paneel.
 * Slug wordt afgeleid uit de naam met dedupe-suffix als die al bestaat.
 * Plan en VAT zijn optioneel — kunnen later via updateOrg.
 */
export async function createOrg(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const name = String(formData.get("name") ?? "").trim();
  const countryInput = String(formData.get("country") ?? "");
  const planInput = String(formData.get("plan") ?? "");
  const vatInput = String(formData.get("vatNumber") ?? "").trim();

  const country = (COUNTRY_VALUES as readonly string[]).includes(countryInput)
    ? (countryInput as Country)
    : null;
  if (!name || !country) return { ok: false, messageKey: "missing_fields" };

  const plan = (PLAN_VALUES as readonly string[]).includes(planInput) ? (planInput as Plan) : null;

  // Probeer base slug; voeg numerieke suffix toe als die al bestaat.
  let slug = slugify(name) || "org";
  let suffix = 1;
  while (true) {
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      columns: { id: true },
    });
    if (!existing) break;
    suffix += 1;
    slug = `${slugify(name) || "org"}-${suffix}`;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      country,
      plan,
      planStartedAt: plan ? new Date() : null,
      vatNumber: vatInput || null,
    })
    .returning({ id: organizations.id });

  revalidatePath(`/admin`);
  revalidatePath(`/admin/orgs`);
  redirect(`/admin/orgs/${org.id}`);
}

/**
 * Update bestaande org-velden — naam, plan, country, BTW. Plan-wissel
 * bumpt planStartedAt zodat we kunnen zien wanneer een upgrade inging.
 */
export async function updateOrg(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const name = String(formData.get("name") ?? "").trim();
  const countryInput = String(formData.get("country") ?? "");
  const planInput = String(formData.get("plan") ?? "");
  const vatInput = String(formData.get("vatNumber") ?? "").trim();

  const country = (COUNTRY_VALUES as readonly string[]).includes(countryInput)
    ? (countryInput as Country)
    : null;
  if (!name || !country) return { ok: false, messageKey: "missing_fields" };

  const plan =
    planInput === ""
      ? null
      : (PLAN_VALUES as readonly string[]).includes(planInput)
        ? (planInput as Plan)
        : null;

  const current = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { plan: true },
  });
  const planChanged = current?.plan !== plan;

  await db
    .update(organizations)
    .set({
      name,
      country,
      plan,
      vatNumber: vatInput || null,
      ...(planChanged ? { planStartedAt: plan ? new Date() : null } : {}),
    })
    .where(eq(organizations.id, organizationId));

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/admin/orgs`);
  revalidatePath(`/admin`);
  return { ok: true, messageKey: "saved" };
}

const PROJECT_TYPES = ["care", "build", "website", "webshop", "system", "seo"] as const;
type ProjectType = (typeof PROJECT_TYPES)[number];

/**
 * Maak nieuw project aan voor een organisatie. Standaard status
 * "in_progress" zodat het direct in de actieve-projecten-lijst van
 * de klant verschijnt; staff kan dit later bijstellen via updateProject.
 */
export async function createProject(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const name = String(formData.get("name") ?? "").trim();
  const typeInput = String(formData.get("type") ?? "");
  const urlInput = String(formData.get("url") ?? "").trim();

  if (!name) return { ok: false, messageKey: "missing_fields" };
  const type = (PROJECT_TYPES as readonly string[]).includes(typeInput)
    ? (typeInput as ProjectType)
    : null;
  if (!type) return { ok: false, messageKey: "missing_fields" };

  await db.insert(projects).values({
    organizationId,
    name,
    type,
    status: "in_progress",
    progress: 0,
    monitoringTargetUrl: urlInput || null,
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

const BUILD_EXTENSIONS = ["light", "standard", "custom"] as const;
type BuildExtension = (typeof BUILD_EXTENSIONS)[number];

/**
 * Start een Build-fase voor een organisatie. endsAt wordt automatisch
 * berekend uit startedAt + durationMonths × 30 dagen — same logic als
 * de Stripe cancel_at flow gebruikt.
 */
export async function createBuildPhase(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const extensionInput = String(formData.get("extension") ?? "");
  const monthsInput = Number(formData.get("durationMonths") ?? 0);
  const label = String(formData.get("label") ?? "").trim();
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  const startedOnRaw = String(formData.get("startedOn") ?? "").trim();

  const extension = (BUILD_EXTENSIONS as readonly string[]).includes(extensionInput)
    ? (extensionInput as BuildExtension)
    : null;
  if (!extension) return { ok: false, messageKey: "missing_fields" };

  const durationMonths = Math.max(1, Math.min(12, Math.round(monthsInput)));
  if (!label) return { ok: false, messageKey: "missing_fields" };

  const startedAt = startedOnRaw ? new Date(startedOnRaw) : new Date();
  const endsAt = new Date(startedAt.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

  await db.insert(buildPhases).values({
    organizationId,
    extension,
    startedAt,
    endsAt,
    durationMonths,
    label,
    projectId: projectIdRaw || null,
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

// --- staff invites -------------------------------------------------------
//
// Token-based invite-flow. Een staff-member kan via /admin/team een email
// uitnodigen; de invitee krijgt een mail met magic-link naar /login. Bij
// eerste signIn match'en we email tegen actieve invites en flippen
// users.isStaff = true. Geen DB-toegang meer nodig om collega-staff toe te
// voegen.

const INVITE_TTL_DAYS = 7;

/**
 * Maak een nieuwe staff-invite aan. Email wordt genormaliseerd naar
 * lowercase. Eventuele actieve invite voor dezelfde email wordt
 * vervangen — geen dubbele tokens. Stuurt mail; faalt graceful als
 * SMTP klapt (invite blijft staan, kan worden re-sent).
 */
export async function inviteStaff(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const emailRaw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!emailRaw || !emailRaw.includes("@") || !emailRaw.includes(".")) {
    return { ok: false, messageKey: "missing_fields" };
  }

  // Revoke any existing live invite for this email — clean replace.
  await db
    .update(staffInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(staffInvites.email, emailRaw),
        isNull(staffInvites.acceptedAt),
        isNull(staffInvites.revokedAt),
      ),
    );

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(staffInvites).values({
    email: emailRaw,
    token,
    invitedBy: userId,
    expiresAt,
  });

  try {
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true, email: true },
    });
    await sendStaffInvite({
      to: emailRaw,
      inviterName: inviter?.name ?? null,
      inviterEmail: inviter?.email ?? null,
    });
  } catch (err) {
    // Mail kan stuk zijn — invite blijft staan in DB, kan re-sent.
    console.error("[admin] invite email failed:", err);
  }

  revalidatePath(`/admin/team`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Trek een nog niet geaccepteerde invite in. Token wordt ongeldig.
 */
export async function revokeStaffInvite(
  inviteId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // formData niet gebruikt — revoke heeft geen body. Touch om
  // ts/eslint vreedzaam te houden.
  void formData;
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  await db
    .update(staffInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(staffInvites.id, inviteId), isNull(staffInvites.acceptedAt)));

  revalidatePath(`/admin/team`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Markeer een user als isStaff op basis van email-match met een actieve
 * invite. Aangeroepen vanuit lib/auth.ts events.signIn — daar weten we
 * net wie er inlogt. Returnt of de promote heeft plaatsgevonden zodat
 * de auth-flow eventueel kan loggen.
 */
export async function promoteUserIfInvited(email: string): Promise<boolean> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;

  const invite = await db.query.staffInvites.findFirst({
    where: and(
      eq(staffInvites.email, trimmed),
      isNull(staffInvites.acceptedAt),
      isNull(staffInvites.revokedAt),
      gt(staffInvites.expiresAt, new Date()),
    ),
  });
  if (!invite) return false;

  await db.update(users).set({ isStaff: true }).where(eq(users.email, trimmed));
  await db
    .update(staffInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(staffInvites.id, invite.id));
  return true;
}

// --- Subscription, discount, VIP -----------------------------------------

/**
 * Wissel het base-plan van een klant naar een andere tier. Vereist een
 * actieve Stripe-subscription op de organisatie. Stripe handelt prorate;
 * daarna sync'en we de lokale subscriptions-row. Bumpt planStartedAt op
 * de organisatie zodat het portal "sinds {datum}" correct toont.
 */
export async function changePlan(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  if (!isStripeConfigured()) return { ok: false, messageKey: "missing_fields" };

  const planInput = String(formData.get("plan") ?? "");
  const plan = (PLAN_VALUES as readonly string[]).includes(planInput) ? (planInput as Plan) : null;
  if (!plan) return { ok: false, messageKey: "missing_fields" };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  try {
    await changeSubscriptionPlan(sub.stripeSubscriptionId, plan);
  } catch (err) {
    console.error("[admin] Stripe plan-change failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  await db
    .update(subscriptions)
    .set({ plan, status: "active" })
    .where(eq(subscriptions.id, sub.id));
  await db
    .update(organizations)
    .set({ plan, planStartedAt: new Date() })
    .where(eq(organizations.id, organizationId));
  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "subscription.plan_changed",
    targetType: "subscription",
    targetId: sub.id,
    metadata: { newPlan: plan, oldPlan: sub.plan },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Pauzeer collection voor 1-3 maanden. Klant houdt toegang, geen
 * invoices in die periode.
 */
export async function pauseSubscription(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  if (!isStripeConfigured()) return { ok: false, messageKey: "missing_fields" };

  const months = Math.max(1, Math.min(3, Number(formData.get("months") ?? 1)));
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  try {
    await pauseStripeSubscription(sub.stripeSubscriptionId, months);
  } catch (err) {
    console.error("[admin] Stripe pause failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "subscription.paused",
    targetType: "subscription",
    targetId: sub.id,
    metadata: { months },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Resume gepauzeerde subscription — collection start direct weer.
 */
export async function resumeSubscription(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  void formData;
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  if (!isStripeConfigured()) return { ok: false, messageKey: "missing_fields" };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  try {
    await resumeStripeSubscription(sub.stripeSubscriptionId);
  } catch (err) {
    console.error("[admin] Stripe resume failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "subscription.resumed",
    targetType: "subscription",
    targetId: sub.id,
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Cancel-at-period-end. Klant houdt toegang tot eind van huidige
 * periode; geen nieuwe invoices.
 */
export async function cancelSubscription(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  void formData;
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  if (!isStripeConfigured()) return { ok: false, messageKey: "missing_fields" };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  try {
    await cancelStripeSubscription(sub.stripeSubscriptionId);
  } catch (err) {
    console.error("[admin] Stripe cancel failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "subscription.cancelled",
    targetType: "subscription",
    targetId: sub.id,
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Geef een klant een Stripe-coupon-discount op zijn actieve subscription.
 * percentOff: 5-100. monthsApplied: 0 = forever, anders 1-12 maanden.
 */
export async function grantDiscount(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  if (!isStripeConfigured()) return { ok: false, messageKey: "missing_fields" };

  const percentOff = Math.max(5, Math.min(100, Number(formData.get("percentOff") ?? 0)));
  const monthsRaw = Number(formData.get("monthsApplied") ?? 0);
  const monthsApplied = monthsRaw === 0 ? null : Math.max(1, Math.min(12, Math.round(monthsRaw)));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { ok: false, messageKey: "missing_fields" };

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { name: true },
  });
  if (!org) return { ok: false, messageKey: "missing_fields" };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  let couponId: string;
  try {
    couponId = await applyDiscountCoupon({
      stripeSubscriptionId: sub.stripeSubscriptionId,
      percentOff,
      monthsApplied,
      orgName: org.name,
    });
  } catch (err) {
    console.error("[admin] Stripe coupon failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  await db.insert(discounts).values({
    organizationId,
    stripeCouponId: couponId,
    percentOff,
    monthsApplied,
    reason,
    grantedBy: userId,
  });
  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "discount.granted",
    targetType: "subscription",
    targetId: sub.id,
    metadata: { percentOff, monthsApplied, reason },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Toggle de VIP-flag op een organisatie. Visueel: wijn-rode tag in
 * alle admin-lijsten. Functioneel kun je hier later SLA-prioriteit of
 * premium support aan koppelen.
 */
export async function toggleVip(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  void formData;
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const current = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { isVip: true },
  });
  const next = !current?.isVip;

  await db.update(organizations).set({ isVip: next }).where(eq(organizations.id, organizationId));
  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: next ? "org.vip_set" : "org.vip_unset",
    targetType: "organization",
    targetId: organizationId,
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/admin/orgs`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Wizard create-org: 3-stappen formulier in 1 server-action. Maakt org
 * + ownership-user (als email opgegeven) + optioneel welcome-mail.
 */
export async function createOrgWithOwner(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const name = String(formData.get("name") ?? "").trim();
  const countryInput = String(formData.get("country") ?? "");
  const planInput = String(formData.get("plan") ?? "");
  const vatInput = String(formData.get("vatNumber") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "")
    .trim()
    .toLowerCase();
  // Optioneel — meegestuurd vanuit een configurator-lead (/admin/orgs/new?…).
  const projectTypeInput = String(formData.get("projectType") ?? "");
  const projectType: "website" | "webshop" | null =
    projectTypeInput === "website" || projectTypeInput === "webshop" ? projectTypeInput : null;
  const leadId = String(formData.get("leadId") ?? "").trim() || null;

  const country = (COUNTRY_VALUES as readonly string[]).includes(countryInput)
    ? (countryInput as Country)
    : null;
  if (!name || !country) return { ok: false, messageKey: "missing_fields" };

  const plan = (PLAN_VALUES as readonly string[]).includes(planInput) ? (planInput as Plan) : null;

  let slug = slugify(name) || "org";
  let suffix = 1;
  while (true) {
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      columns: { id: true },
    });
    if (!existing) break;
    suffix += 1;
    slug = `${slugify(name) || "org"}-${suffix}`;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      country,
      plan,
      planStartedAt: plan ? new Date() : null,
      vatNumber: vatInput || null,
    })
    .returning({ id: organizations.id });

  // Owner-user: maak alleen aan als email opgegeven. Naam mag leeg —
  // klant kan 'm later zelf zetten via portal/settings.
  let createdNewUser = false;
  if (ownerEmail && ownerEmail.includes("@")) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, ownerEmail),
      columns: { id: true, organizationId: true },
    });
    if (existingUser) {
      // Bestaande user — koppel aan deze org als hij nog geen org heeft.
      if (!existingUser.organizationId) {
        await db
          .update(users)
          .set({ organizationId: org.id, role: "owner", name: ownerName || null })
          .where(eq(users.id, existingUser.id));
      }
    } else {
      // Nieuwe user — auth.js DrizzleAdapter maakt hem normaal pas bij
      // eerste magic-link; hier creëren we de row alvast zodat de admin
      // hem in de members-lijst ziet en zodat de welcome-mail naar
      // het juiste id verwijst.
      await db.insert(users).values({
        id: randomUUID(),
        email: ownerEmail,
        name: ownerName || null,
        organizationId: org.id,
        role: "owner",
      });
      createdNewUser = true;
    }
  }

  // Vanuit een configurator-lead: meteen een project aanmaken zodat staff
  // niet handmatig hoeft. Naam = "Nieuwe website/webshop · {org}", type uit
  // de configurator-keuze, status 'planning'. De gedetailleerde configurator-
  // keuzes staan al in leadActivity en blijven op de leaddetail-pagina.
  if (projectType) {
    await db.insert(projects).values({
      organizationId: org.id,
      name: `${projectType === "webshop" ? "Nieuwe webshop" : "Nieuwe website"} · ${name}`,
      type: projectType,
      status: "planning",
      nextMilestone: "Configurator-aanvraag — scope & design afstemmen in de kennismaking",
    });
  }

  // Lead koppelen + op 'customer' zetten zodat de pipeline klopt.
  if (leadId) {
    try {
      await db
        .update(leads)
        .set({
          linkedOrgId: org.id,
          status: "customer",
          nextActionAt: null,
          nextActionLabel: null,
        })
        .where(eq(leads.id, leadId));
      await db.insert(leadActivity).values({
        leadId,
        kind: "status_changed",
        summary: `Org aangemaakt (${name}) — lead → customer${projectType ? `, project (${projectType}) aangemaakt` : ""}`,
        metadata: { type: "converted_to_org", orgId: org.id, projectType },
      });
    } catch (err) {
      console.error("[createOrgWithOwner] lead link failed:", err);
      // Org + project zijn rond; de lead-koppeling is best-effort.
    }
  }

  // Welkom/inlog-mail naar een nét aangemaakte owner — zelfde patroon als de
  // checkout-done-handler (de Drizzle-insert hierboven triggert het auth.js
  // createUser-event niet). Faalt graceful.
  if (createdNewUser && ownerEmail) {
    try {
      const baseUrl = process.env.AUTH_URL ?? "https://webstability.eu";
      await sendWelcomeEmail({
        to: ownerEmail,
        name: ownerName || null,
        portalUrl: `${baseUrl}/portal/dashboard`,
        locale: "nl",
      });
    } catch (err) {
      console.error("[createOrgWithOwner] welcome email failed:", err);
    }
  }

  revalidatePath(`/admin`);
  revalidatePath(`/admin/orgs`);
  if (leadId) {
    revalidatePath(`/admin/leads`);
    revalidatePath(`/admin/leads/${leadId}`);
  }
  redirect(`/admin/orgs/${org.id}`);
}

/**
 * Drag-and-drop variant van updateTicketStatus — neemt direct het
 * nieuwe status-string in plaats van FormData. Bedoeld voor de
 * kanban-view in /admin/tickets waar we niet door een form heen gaan.
 */
export async function changeTicketStatusDirect(
  ticketId: string,
  newStatus: "open" | "in_progress" | "waiting" | "closed",
): Promise<void> {
  await requireStaff();
  await db
    .update(tickets)
    .set({
      status: newStatus,
      closedAt: newStatus === "closed" ? new Date() : null,
    })
    .where(eq(tickets.id, ticketId));
  revalidatePath(`/admin/tickets`);
  revalidatePath(`/admin/tickets/${ticketId}`);
}

/**
 * Staff-antwoord op een ticket vanuit de admin-ticket-detailpagina. Post de
 * reply als de ingelogde staff-user; als het ticket nog 'open' was → naar
 * 'in_progress' (staff heeft 'm opgepakt). Klant ziet de reply in z'n portal
 * (TicketRepliesLive polling) + zou later een notificatie kunnen krijgen.
 */
export async function staffReplyToTicket(
  ticketId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, messageKey: "missing_fields" };

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    columns: { id: true, status: true },
  });
  if (!ticket) return { ok: false, messageKey: "missing_fields" };

  await db.insert(ticketReplies).values({ ticketId, userId, body });
  if (ticket.status === "open") {
    await db.update(tickets).set({ status: "in_progress" }).where(eq(tickets.id, ticketId));
  }
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/admin/tickets`);
  return { ok: true };
}

/**
 * Post een korte staff-update op een project. Verschijnt op
 * /portal/projects/[id] en wordt gebundeld in de wekelijkse update-
 * mail door cron `weekly-update`. Markdown-tekst, geen versies.
 */
export async function postProjectUpdate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!projectId || !body) return { ok: false, messageKey: "missing_fields" };
  if (body.length > 2000) return { ok: false, messageKey: "too_long" };

  // Verifieer project bestaat + haal organizationId op voor index
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, organizationId: true, name: true },
  });
  if (!project) return { ok: false, messageKey: "not_found" };

  await db.insert(projectUpdates).values({
    projectId,
    organizationId: project.organizationId,
    postedBy: userId,
    body,
  });

  await db.insert(auditLog).values({
    organizationId: project.organizationId,
    userId,
    action: "project.update_posted",
    targetType: "project",
    targetId: projectId,
    metadata: { projectName: project.name, length: body.length },
  });

  revalidatePath(`/admin/orgs/${project.organizationId}`);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "update_posted" };
}

/**
 * Update de "volgende mijlpaal"-tekst op een project. Eén korte zin
 * die staff per week vernieuwt. Geen audit-log nodig — laagdrempelig.
 */
export async function setNextMilestone(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return handleAuthError(e);
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const milestone = String(formData.get("milestone") ?? "").trim();
  if (!projectId) return { ok: false, messageKey: "missing_fields" };

  await db
    .update(projects)
    .set({
      nextMilestone: milestone || null,
      nextMilestoneUpdatedAt: milestone ? new Date() : null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

// --- handover-checklist (sprint D) --------------------------------------

const HANDOVER_MANUAL_KEYS = [
  "domain_coupled",
  "credentials_sent",
  "maintenance_explained",
] as const;
type HandoverManualKey = (typeof HANDOVER_MANUAL_KEYS)[number];

/**
 * Vink (of un-vink) een handover-item dat staff handmatig moet
 * bevestigen. Auto-vinkbare items (deliverables, monitoring, factuur)
 * worden hier niet behandeld — die komen uit getHandoverStatus.
 */
export async function markHandoverItemDone(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const itemKey = String(formData.get("itemKey") ?? "").trim() as HandoverManualKey;
  const checked = String(formData.get("checked") ?? "") === "true";
  if (!projectId || !HANDOVER_MANUAL_KEYS.includes(itemKey)) {
    return { ok: false, messageKey: "missing_fields" };
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, organizationId: true, name: true },
  });
  if (!project) return { ok: false, messageKey: "not_found" };

  // Idempotent upsert — als er nog geen row is, maak 'm aan met dit
  // item gezet; anders update alleen het relevante veld.
  const existing = await db.query.handoverChecklist.findFirst({
    where: eq(handoverChecklist.projectId, projectId),
  });

  const now = checked ? new Date() : null;
  const by = checked ? userId : null;
  const fieldMap: Record<HandoverManualKey, { at: string; by: string }> = {
    domain_coupled: { at: "domainCoupledAt", by: "domainCoupledBy" },
    credentials_sent: { at: "credentialsSentAt", by: "credentialsSentBy" },
    maintenance_explained: { at: "maintenanceExplainedAt", by: "maintenanceExplainedBy" },
  };
  const map = fieldMap[itemKey];

  if (existing) {
    await db
      .update(handoverChecklist)
      .set({ [map.at]: now, [map.by]: by })
      .where(eq(handoverChecklist.projectId, projectId));
  } else {
    await db.insert(handoverChecklist).values({
      projectId,
      organizationId: project.organizationId,
      [map.at]: now,
      [map.by]: by,
    });
  }

  await db.insert(auditLog).values({
    organizationId: project.organizationId,
    userId,
    action: checked ? "handover.item_checked" : "handover.item_unchecked",
    targetType: "project",
    targetId: projectId,
    metadata: { itemKey, projectName: project.name },
  });

  revalidatePath(`/admin/orgs/${project.organizationId}`);
  revalidatePath(`/portal/projects/${projectId}/handover`);
  revalidatePath(`/portal/projects/${projectId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Markeer project als live. Alleen toegestaan als alle handover-items
 * (auto + handmatig) ✓ zijn. Anders return een gerichte error zodat
 * staff weet wat er nog mist. Triggert dezelfde livegang-flow als de
 * status-flip via updateProject (mail + audit-log + liveAt).
 */
export async function markProjectLive(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { ok: false, messageKey: "missing_fields" };

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      organizationId: true,
      name: true,
      status: true,
      liveAt: true,
      monitoringTargetUrl: true,
    },
  });
  if (!project) return { ok: false, messageKey: "not_found" };
  if (project.liveAt) return { ok: true, messageKey: "saved" };

  const status = await getHandoverStatus(project.organizationId, projectId);
  if (!status || !status.allDone) {
    return { ok: false, messageKey: "handover_incomplete" };
  }

  const now = new Date();
  await db
    .update(projects)
    .set({ status: "live", liveAt: now, progress: 100 })
    .where(eq(projects.id, projectId));

  await db.insert(auditLog).values({
    organizationId: project.organizationId,
    userId,
    action: "project.live",
    targetType: "project",
    targetId: projectId,
    metadata: {
      name: project.name,
      url: project.monitoringTargetUrl ?? null,
      via: "handover_checklist",
    },
  });

  try {
    const owner = await db.query.users.findFirst({
      where: and(eq(users.organizationId, project.organizationId), eq(users.role, "owner")),
      columns: { email: true, name: true, locale: true },
    });
    if (owner?.email) {
      const { sendLivegangMail } = await import("@/lib/email/livegang");
      await sendLivegangMail({
        to: owner.email,
        name: owner.name ?? null,
        projectName: project.name,
        projectUrl: project.monitoringTargetUrl ?? null,
        locale: owner.locale === "es" ? "es" : "nl",
      });
    }
  } catch (err) {
    console.error("[admin] livegang mail failed:", err);
  }

  revalidatePath(`/admin/orgs/${project.organizationId}`);
  revalidatePath(`/portal/dashboard`);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}/handover`);
  return { ok: true, messageKey: "project_live" };
}

// ===========================================================================
// Website-abonnement-klanten — legacy-pakket, Stripe-koppeling, file/factuur
// upload. Voor bestaande klanten met een eigen pakket (geen care/studio/
// atelier-tier). Zie het plan in .claude/plans en lib/db/schema.ts.
// ===========================================================================

const BILLING_INTERVALS = ["monthly", "yearly"] as const;
type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** Zet het legacy-pakket (vrije naam, prijs, frequentie) + website-info op
 * een org. Lege pakketnaam = pakket-velden gewist (terug naar tier-klant).
 * Lege website-velden worden ook gewist. */
export async function updateOrgPackage(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const packageName = String(formData.get("packageName") ?? "").trim();
  const priceEurRaw = String(formData.get("priceEur") ?? "")
    .trim()
    .replace(",", ".");
  const intervalInput = String(formData.get("billingInterval") ?? "");
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const websiteNote = String(formData.get("websiteNote") ?? "").trim();

  const interval: BillingInterval | null = (BILLING_INTERVALS as readonly string[]).includes(
    intervalInput,
  )
    ? (intervalInput as BillingInterval)
    : null;

  let priceCents: number | null = null;
  if (packageName && priceEurRaw) {
    const n = Number.parseFloat(priceEurRaw);
    if (!Number.isFinite(n) || n < 0) return { ok: false, messageKey: "missing_fields" };
    priceCents = Math.round(n * 100);
  }

  await db
    .update(organizations)
    .set({
      legacyPackageName: packageName || null,
      legacyPackagePriceCents: packageName ? priceCents : null,
      legacyBillingInterval: packageName ? interval : null,
      websiteUrl: websiteUrl || null,
      websiteNote: websiteNote || null,
    })
    .where(eq(organizations.id, organizationId));

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "org.package_updated",
    targetType: "organization",
    targetId: organizationId,
    metadata: {
      packageName: packageName || null,
      priceCents,
      interval,
      websiteUrl: websiteUrl || null,
    },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/dashboard`);
  return { ok: true, messageKey: "saved" };
}

/** Koppelt een bestaande Stripe-customer + subscription aan een org. De
 * Stripe-objecten zelf maakt Laurens in het Stripe-dashboard aan (Product +
 * Price met het juiste interval, Customer, Subscription). Hierna haalt de
 * Stripe-webhook (upsertInvoice → matcht op stripeCustomerId) de facturen
 * + PDF's vanzelf binnen. `plan` mag leeg blijven voor legacy-pakketten. */
export async function linkStripeSubscription(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const stripeCustomerId = String(formData.get("stripeCustomerId") ?? "").trim();
  const stripeSubscriptionId = String(formData.get("stripeSubscriptionId") ?? "").trim();
  const planInput = String(formData.get("plan") ?? "").trim();
  if (!stripeCustomerId) return { ok: false, messageKey: "missing_fields" };

  const plan =
    planInput === ""
      ? null
      : (PLAN_VALUES as readonly string[]).includes(planInput)
        ? (planInput as Plan)
        : null;

  await db
    .update(organizations)
    .set({ stripeCustomerId })
    .where(eq(organizations.id, organizationId));

  if (stripeSubscriptionId) {
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
      columns: { id: true },
    });
    if (existing) {
      await db
        .update(subscriptions)
        .set({ organizationId, plan, status: "active" })
        .where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values({
        organizationId,
        plan,
        status: "active",
        stripeSubscriptionId,
      });
    }
  }

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "subscription.stripe_linked",
    targetType: "organization",
    targetId: organizationId,
    metadata: { stripeCustomerId, stripeSubscriptionId: stripeSubscriptionId || null, plan },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  return { ok: true, messageKey: "saved" };
}

const INVOICE_UPLOAD_STATUSES = ["sent", "paid"] as const;
type InvoiceUploadStatus = (typeof INVOICE_UPLOAD_STATUSES)[number];

function eurToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Uploadt een factuur-PDF (bv. uit de boekhouder) naar Vercel Blob en
 * maakt een invoices-row met pdfUrl gevuld. Voor klanten zonder Stripe-
 * koppeling, of voor losse facturen. */
export async function uploadInvoicePdf(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, messageKey: "blob_not_configured" };
  }
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const file = formData.get("file") as File | null;
  const number = String(formData.get("number") ?? "").trim();
  const amountCents = eurToCents(String(formData.get("amountEur") ?? ""));
  const vatCents = eurToCents(String(formData.get("vatEur") ?? "")) ?? 0;
  const dateRaw = String(formData.get("invoiceDate") ?? "").trim();
  const statusInput = String(formData.get("status") ?? "sent");
  const status: InvoiceUploadStatus = (INVOICE_UPLOAD_STATUSES as readonly string[]).includes(
    statusInput,
  )
    ? (statusInput as InvoiceUploadStatus)
    : "sent";

  if (!file || file.size === 0 || !number || amountCents === null) {
    return { ok: false, messageKey: "missing_fields" };
  }

  const invoiceDate = dateRaw ? new Date(dateRaw) : new Date();
  const blobPath = `org/${organizationId}/invoices/${Date.now()}-${file.name}`;
  const blob = await put(blobPath, file, { access: "public" });

  await db.insert(invoices).values({
    organizationId,
    number,
    amount: amountCents,
    vatAmount: vatCents,
    status,
    dueAt: invoiceDate,
    paidAt: status === "paid" ? invoiceDate : null,
    pdfUrl: blob.url,
  });

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "invoice.uploaded",
    targetType: "organization",
    targetId: organizationId,
    metadata: { number, amountCents, status },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/invoices`);
  return { ok: true, messageKey: "saved" };
}

const ORG_FILE_CATEGORIES = [
  "contract",
  "asset",
  "deliverable",
  "report",
  "brand_kit",
  "copy",
  "screenshot",
  "wireframe",
  "final_handover",
] as const;
type OrgFileCategory = (typeof ORG_FILE_CATEGORIES)[number];

/** Generieke admin-file-upload voor een org (los van facturen). Verschijnt
 * meteen in het klantportaal onder /portal/files. */
export async function uploadOrgFile(
  organizationId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, messageKey: "blob_not_configured" };
  }
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const file = formData.get("file") as File | null;
  const categoryInput = String(formData.get("category") ?? "deliverable");
  const category: OrgFileCategory = (ORG_FILE_CATEGORIES as readonly string[]).includes(
    categoryInput,
  )
    ? (categoryInput as OrgFileCategory)
    : "deliverable";
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  if (!file || file.size === 0) return { ok: false, messageKey: "missing_file" };

  const blobPath = `org/${organizationId}/${Date.now()}-${file.name}`;
  const blob = await put(blobPath, file, { access: "public" });

  await db.insert(files).values({
    organizationId,
    projectId: projectIdRaw || null,
    name: file.name,
    url: blob.url,
    blobPath: blob.pathname,
    category,
    uploadedBy: userId,
  });

  await db.insert(auditLog).values({
    organizationId,
    userId,
    action: "file.uploaded_by_staff",
    targetType: "organization",
    targetId: organizationId,
    metadata: { name: file.name, category },
  });

  revalidatePath(`/admin/orgs/${organizationId}`);
  revalidatePath(`/portal/files`);
  return { ok: true, messageKey: "saved" };
}
