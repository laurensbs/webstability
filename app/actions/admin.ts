"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, projects, tickets } from "@/lib/db/schema";
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
  const status = PROJECT_STATUSES.includes(statusInput as ProjectStatus)
    ? (statusInput as ProjectStatus)
    : null;
  if (!status) return { ok: false, messageKey: "missing_fields" };

  const progress = Math.max(0, Math.min(100, Math.round(progressInput)));

  await db.update(projects).set({ status, progress }).where(eq(projects.id, projectId));
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
