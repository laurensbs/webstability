"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  organizations,
  intakeResponses,
  projects,
  bookings,
  auditLog,
} from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { sendWelcomeCallStaffNotify } from "@/lib/email/welcome-call-staff-notify";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, email: true, organizationId: true, role: true, isDemo: true },
  });
  if (!user?.organizationId) throw new Error("no_org");
  if (user.isDemo) throw new Error("demo_readonly");
  if (user.role !== "owner") throw new Error("not_owner");
  return { userId: user.id, orgId: user.organizationId, name: user.name, email: user.email };
}

type IntakeAnswers = {
  company?: { name?: string; vat?: string; website?: string; pitch?: string };
  build?: { type?: string; details?: string };
  audience?: { audience?: string; market?: string; languages?: string[] };
  current?: { tools?: string[]; frustration?: string };
  musthaves?: { features?: string[] };
  branding?: { hasBranding?: string; vibe?: string; logoUrl?: string };
  integrations?: { integrations?: string[]; other?: string };
  call?: { startsAt?: string; calMeetingId?: string; meetingUrl?: string; note?: string };
};

/**
 * Sla concept van intake-form op. Idempotent: vindt of maakt rij voor de
 * org. Klant kan tussentijds 'sla op en sluit' doen en later terugkomen.
 */
export async function saveIntakeDraft(formData: FormData): Promise<ActionResult> {
  let orgId: string;
  try {
    ({ orgId } = await requireOwner());
  } catch (e) {
    return { ok: false, messageKey: e instanceof Error ? e.message : "unauthorized" };
  }

  const answersRaw = formData.get("answers");
  const stepRaw = formData.get("currentStep");
  if (typeof answersRaw !== "string") {
    return { ok: false, messageKey: "invalid_payload" };
  }

  let answers: IntakeAnswers;
  try {
    answers = JSON.parse(answersRaw) as IntakeAnswers;
  } catch {
    return { ok: false, messageKey: "invalid_payload" };
  }

  const currentStep = Math.max(1, Math.min(8, Number(stepRaw ?? 1)));

  const existing = await db.query.intakeResponses.findFirst({
    where: eq(intakeResponses.organizationId, orgId),
  });

  if (existing) {
    await db
      .update(intakeResponses)
      .set({ answers, currentStep, updatedAt: new Date() })
      .where(eq(intakeResponses.id, existing.id));
  } else {
    await db.insert(intakeResponses).values({
      organizationId: orgId,
      answers,
      currentStep,
      status: "draft",
    });
  }

  return { ok: true, messageKey: "intake_draft_saved" };
}

/**
 * Final submit: markeer intake als ingediend, maak het eerste project aan,
 * registreer de welcome-call booking, en stuur staff-notify mail. Zet
 * `org.intakeCompletedAt` zodat de portal-layout-redirect niet meer
 * triggert.
 */
export async function submitIntakeForm(formData: FormData): Promise<ActionResult> {
  let userId: string;
  let orgId: string;
  let userName: string | null = null;
  let userEmail: string | null = null;
  try {
    const u = await requireOwner();
    userId = u.userId;
    orgId = u.orgId;
    userName = u.name;
    userEmail = u.email;
  } catch (e) {
    return { ok: false, messageKey: e instanceof Error ? e.message : "unauthorized" };
  }

  const answersRaw = formData.get("answers");
  if (typeof answersRaw !== "string") {
    return { ok: false, messageKey: "invalid_payload" };
  }

  let answers: IntakeAnswers;
  try {
    answers = JSON.parse(answersRaw) as IntakeAnswers;
  } catch {
    return { ok: false, messageKey: "invalid_payload" };
  }

  // Validatie minimumeisen voor submit: bedrijfsnaam + build-type +
  // welcome-call gepland. Andere velden mogen leeg blijven (klant
  // verfijnt op de welcome-call).
  if (!answers.company?.name?.trim()) {
    return { ok: false, messageKey: "missing_company_name" };
  }
  if (!answers.build?.type) {
    return { ok: false, messageKey: "missing_build_type" };
  }
  if (!answers.call?.startsAt) {
    return { ok: false, messageKey: "missing_welcome_call" };
  }

  const now = new Date();
  const callStartsAt = new Date(answers.call.startsAt);
  if (Number.isNaN(callStartsAt.getTime())) {
    return { ok: false, messageKey: "invalid_call_date" };
  }

  // 1. Upsert intake-response naar 'submitted'
  const existing = await db.query.intakeResponses.findFirst({
    where: eq(intakeResponses.organizationId, orgId),
  });
  if (existing) {
    await db
      .update(intakeResponses)
      .set({
        answers,
        currentStep: 8,
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(intakeResponses.id, existing.id));
  } else {
    await db.insert(intakeResponses).values({
      organizationId: orgId,
      answers,
      currentStep: 8,
      status: "submitted",
      submittedAt: now,
    });
  }

  // 2. Project-spawn op basis van type-keuze
  const projectName = projectNameFor(answers.build.type, answers.build.details);
  const [createdProject] = await db
    .insert(projects)
    .values({
      organizationId: orgId,
      name: projectName,
      type: "build",
      status: "planning",
      progress: 0,
    })
    .returning({ id: projects.id });

  // 3. Welcome-call booking — calMeetingId optioneel (komt pas bij
  //    Cal.com webhook in fase 2). attendeeEmail = owner-email.
  await db.insert(bookings).values({
    organizationId: orgId,
    type: "welcome_call",
    calMeetingId: answers.call.calMeetingId ?? null,
    startsAt: callStartsAt,
    status: "scheduled",
    attendeeEmail: userEmail,
    attendeeName: userName,
    meetingUrl: answers.call.meetingUrl ?? null,
    notes: answers.call.note ?? null,
  });

  // 4. Markeer org als intake-completed zodat de gate-redirect stopt
  await db.update(organizations).set({ intakeCompletedAt: now }).where(eq(organizations.id, orgId));

  // 5. Audit-log
  await db.insert(auditLog).values({
    organizationId: orgId,
    userId,
    action: "intake.submitted",
    targetType: "intake",
    metadata: {
      buildType: answers.build.type,
      callAt: callStartsAt.toISOString(),
      projectId: createdProject?.id ?? null,
    },
  });

  // 6. Staff-notify mail (failt graceful — de submit moet niet
  //    blokkeren als SMTP down is).
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { name: true },
    });
    await sendWelcomeCallStaffNotify({
      orgName: org?.name ?? "Onbekende klant",
      ownerName: userName,
      ownerEmail: userEmail,
      callStartsAt,
      buildType: answers.build.type,
      pitch: answers.company?.pitch ?? null,
      orgId,
    });
  } catch (err) {
    console.error("[intake] staff-notify mail failed:", err);
  }

  revalidatePath("/portal/intake");
  revalidatePath("/portal/dashboard");
  revalidatePath("/admin");

  return { ok: true, messageKey: "intake_submitted" };
}

function projectNameFor(type: string, details?: string | null): string {
  const map: Record<string, string> = {
    verhuurplatform: "Verhuurplatform",
    reparatie: "Reparatie-portaal",
    webshop: "Website / webshop",
    anders: "Maatwerk-build",
  };
  const base = map[type] ?? "Maatwerk-build";
  if (details && details.trim()) {
    return `${base} — ${details.trim().slice(0, 60)}`;
  }
  return base;
}
