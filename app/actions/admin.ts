"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendStaffInvite } from "@/lib/email/staff-invite";
import {
  users,
  projects,
  tickets,
  hoursLogged,
  organizations,
  buildPhases,
  staffInvites,
} from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, isStaff: true },
  });
  if (!user?.isStaff) throw new Error("forbidden");
  return { userId: user.id };
}

const PROJECT_STATUSES = ["planning", "in_progress", "review", "live", "done"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export async function updateProject(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, messageKey: "forbidden" };
  }

  const statusInput = String(formData.get("status") ?? "");
  const progressInput = Number(formData.get("progress") ?? 0);
  const urlInput = String(formData.get("url") ?? "").trim();
  const status = PROJECT_STATUSES.includes(statusInput as ProjectStatus)
    ? (statusInput as ProjectStatus)
    : null;
  if (!status) return { ok: false, messageKey: "missing_fields" };

  const progress = Math.max(0, Math.min(100, Math.round(progressInput)));

  await db
    .update(projects)
    .set({
      status,
      progress,
      monitoringTargetUrl: urlInput || null,
    })
    .where(eq(projects.id, projectId));
  revalidatePath(`/admin`);
  revalidatePath(`/admin/orgs`);
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
  } catch {
    return { ok: false, messageKey: "forbidden" };
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
