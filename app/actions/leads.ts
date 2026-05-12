"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DemoReadonlyError } from "@/lib/demo-guard";
import { users, leads, leadActivity, auditLog } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

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
  if (user.isDemo) throw new DemoReadonlyError();
  return { userId: user.id };
}

function handleAuthError(e: unknown): ActionResult {
  if (e instanceof DemoReadonlyError) {
    return { ok: true, messageKey: "demo_readonly" };
  }
  return { ok: false, messageKey: "forbidden" };
}

const SOURCES = ["cal_booking", "demo_self_serve", "manual", "blog_subscribe", "referral"] as const;
const STATUSES = ["cold", "warmed", "booked", "met", "customer", "lost"] as const;

type LeadSource = (typeof SOURCES)[number];
type LeadStatus = (typeof STATUSES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Maak een lead handmatig aan vanuit /admin/leads/new. Email is uniek
 * niet afgedwongen — een mens kan in meerdere bedrijven zitten — maar
 * dubbele exacte rij is wel relevant; we doen geen merge hier.
 */
export async function createLead(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { leadId?: string }> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const sourceInput = String(formData.get("source") ?? "manual");
  const notes = String(formData.get("notes") ?? "").trim();
  const nextActionLabel = String(formData.get("nextActionLabel") ?? "").trim();
  const nextActionAtRaw = String(formData.get("nextActionAt") ?? "").trim();

  if (!email || !EMAIL_RE.test(email)) return { ok: false, messageKey: "missing_fields" };
  const source = (SOURCES as readonly string[]).includes(sourceInput)
    ? (sourceInput as LeadSource)
    : "manual";

  const [created] = await db
    .insert(leads)
    .values({
      email,
      name: name || null,
      company: company || null,
      source,
      status: "cold",
      ownerStaffId: userId,
      notes: notes || null,
      nextActionLabel: nextActionLabel || null,
      nextActionAt: nextActionAtRaw ? new Date(nextActionAtRaw) : null,
    })
    .returning({ id: leads.id });

  if (!created) return { ok: false, messageKey: "forbidden" };

  await db.insert(leadActivity).values({
    leadId: created.id,
    kind: "note_added",
    summary: `Lead aangemaakt — bron: ${source}`,
    actorStaffId: userId,
    metadata: { source },
  });

  revalidatePath("/admin/leads");
  return { ok: true, messageKey: "saved", leadId: created.id };
}

/**
 * Update notes, status, next-action of owner van een lead. Status-
 * changes loggen extra activity-entry zodat de tijdlijn zichtbaar
 * blijft. Alle velden zijn optioneel — alleen aanwezige form-fields
 * worden gewijzigd.
 */
export async function updateLead(
  leadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const existing = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    columns: { id: true, status: true, ownerStaffId: true },
  });
  if (!existing) return { ok: false, messageKey: "not_found" };

  const updates: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
  let statusChange: { from: LeadStatus; to: LeadStatus } | null = null;
  let plannedFollowUp: { at: Date; label: string } | null = null;

  if (formData.has("status")) {
    const statusInput = String(formData.get("status") ?? "");
    if ((STATUSES as readonly string[]).includes(statusInput)) {
      const newStatus = statusInput as LeadStatus;
      if (newStatus !== existing.status) {
        statusChange = { from: existing.status as LeadStatus, to: newStatus };
        updates.status = newStatus;
      }
    }
  }
  if (formData.has("notes")) {
    const notes = String(formData.get("notes") ?? "");
    updates.notes = notes.length > 0 ? notes : null;
  }
  if (formData.has("nextActionLabel") || formData.has("nextActionAt")) {
    const label = String(formData.get("nextActionLabel") ?? "").trim();
    const at = String(formData.get("nextActionAt") ?? "").trim();
    updates.nextActionLabel = label || null;
    updates.nextActionAt = at ? new Date(at) : null;
    if (at) plannedFollowUp = { at: new Date(at), label: label || "Opvolgen" };
  }
  if (formData.has("ownerStaffId")) {
    const owner = String(formData.get("ownerStaffId") ?? "").trim();
    updates.ownerStaffId = owner || null;
  }

  await db.update(leads).set(updates).where(eq(leads.id, leadId));

  if (statusChange) {
    await db.insert(leadActivity).values({
      leadId,
      kind: "status_changed",
      summary: `Status: ${statusChange.from} → ${statusChange.to}`,
      actorStaffId: userId,
      metadata: statusChange,
    });
  }
  if (plannedFollowUp) {
    const when = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(
      plannedFollowUp.at,
    );
    await db.insert(leadActivity).values({
      leadId,
      kind: "note_added",
      summary: `Opvolgactie gepland: ${plannedFollowUp.label} — ${when}`,
      actorStaffId: userId,
      metadata: { type: "follow_up_planned", at: plannedFollowUp.at.toISOString() },
    });
  }

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Voeg een vrije note toe aan de activity-tijdlijn van een lead.
 * Niet hetzelfde als de `notes`-kolom op leads (die is een 'sticky'
 * samenvatting); dit is een tijdgebonden notitie.
 */
export async function addLeadNote(
  leadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { ok: false, messageKey: "missing_fields" };
  if (note.length > 2000) return { ok: false, messageKey: "too_long" };

  const existing = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    columns: { id: true },
  });
  if (!existing) return { ok: false, messageKey: "not_found" };

  await db.insert(leadActivity).values({
    leadId,
    kind: "note_added",
    summary: note,
    actorStaffId: userId,
  });

  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Markeer een lead als 'customer' en koppel aan een bestaande org-id.
 * Wordt aangeroepen vanaf /admin/leads/[id] zodra de lead Stripe-
 * checkout heeft afgerond. Geen org-creatie hier — dat doet de
 * Stripe-webhook al.
 */
export async function markLeadAsCustomer(
  leadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const orgId = String(formData.get("linkedOrgId") ?? "").trim();
  if (!orgId) return { ok: false, messageKey: "missing_fields" };

  const existing = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    columns: { id: true, status: true },
  });
  if (!existing) return { ok: false, messageKey: "not_found" };

  await db
    .update(leads)
    .set({
      status: "customer",
      linkedOrgId: orgId,
      nextActionAt: null,
      nextActionLabel: null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivity).values({
    leadId,
    kind: "status_changed",
    summary: `Status: ${existing.status} → customer (gekoppeld aan org)`,
    actorStaffId: userId,
    metadata: { linkedOrgId: orgId },
  });

  await db.insert(auditLog).values({
    organizationId: orgId,
    userId,
    action: "lead.converted",
    targetType: "lead",
    targetId: leadId,
    metadata: {},
  });

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true, messageKey: "saved" };
}

/**
 * Quick-action vanaf de admin-reminders-widget. Markeert de huidige
 * actie als 'gedaan' door nextActionAt op null te zetten (default),
 * of door 7 dagen door te schuiven (snooze=true).
 */
export async function completeLeadAction(
  leadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const snooze = String(formData.get("snooze") ?? "") === "true";

  const existing = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    columns: { id: true, nextActionLabel: true },
  });
  if (!existing) return { ok: false, messageKey: "not_found" };

  const nextActionAt = snooze ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

  await db.update(leads).set({ nextActionAt, updatedAt: new Date() }).where(eq(leads.id, leadId));

  await db.insert(leadActivity).values({
    leadId,
    kind: "note_added",
    summary: snooze
      ? `Actie ge-snoozed (+7 dagen): ${existing.nextActionLabel ?? "—"}`
      : `Actie afgevinkt: ${existing.nextActionLabel ?? "—"}`,
    actorStaffId: userId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Verstuur een outreach-mail op basis van template + (optionele)
 * subject/body-overrides. Schrijft een lead_activity entry zodat de
 * tijdlijn de mail-verstuur registreert.
 */
const TEMPLATES = [
  "lead_outreach_intro",
  "lead_followup_after_call",
  "lead_referral_request",
  "lead_dormant_revive",
] as const;
type Template = (typeof TEMPLATES)[number];

export async function sendLeadOutreach(
  leadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return handleAuthError(e);
  }

  const templateInput = String(formData.get("template") ?? "");
  if (!(TEMPLATES as readonly string[]).includes(templateInput)) {
    return { ok: false, messageKey: "missing_fields" };
  }
  const template = templateInput as Template;
  const customSubject = String(formData.get("subject") ?? "").trim();
  const customBody = String(formData.get("body") ?? "").trim();

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    columns: { id: true, email: true, name: true },
  });
  if (!lead) return { ok: false, messageKey: "not_found" };

  try {
    const { sendOutreachMail } = await import("@/lib/email/lead-outreach");
    await sendOutreachMail({
      to: lead.email,
      leadName: lead.name,
      template,
      customSubject: customSubject || undefined,
      customBody: customBody || undefined,
    });
  } catch (err) {
    console.error("[leads] outreach mail failed:", err);
    return { ok: false, messageKey: "forbidden" };
  }

  await db.insert(leadActivity).values({
    leadId,
    kind: "mail_sent",
    summary: `Mail verzonden: ${template}${customSubject ? ` — "${customSubject}"` : ""}`,
    actorStaffId: userId,
    metadata: { template, customSubjectUsed: Boolean(customSubject) },
  });

  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, messageKey: "saved" };
}

/**
 * Verwijder een lead permanent. Bedoeld voor spam/test-entries. Hard-
 * delete; activity wordt via cascade meegenomen.
 */
export async function deleteLead(leadId: string): Promise<void> {
  try {
    await requireStaff();
  } catch {
    redirect("/portal/dashboard");
  }
  await db.delete(leads).where(eq(leads.id, leadId));
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}
