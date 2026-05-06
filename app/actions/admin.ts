"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, projects, tickets, hoursLogged, organizations, buildPhases } from "@/lib/db/schema";
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
