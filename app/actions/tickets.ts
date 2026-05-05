"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketReplies, users } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

async function requireUserOrg() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, organizationId: true },
  });
  if (!user?.organizationId) throw new Error("no_org");
  return { userId: user.id, orgId: user.organizationId };
}

export async function createTicket(formData: FormData) {
  const { userId, orgId } = await requireUserOrg();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal") as "low" | "normal" | "high";

  if (!subject || !body) throw new Error("missing_fields");

  const [created] = await db
    .insert(tickets)
    .values({
      organizationId: orgId,
      userId,
      subject,
      body,
      priority,
      status: "open",
    })
    .returning({ id: tickets.id });

  revalidatePath("/portal/tickets");
  redirect(`/portal/tickets/${created.id}`);
}

export async function replyToTicket(
  ticketId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let userId: string;
  let orgId: string;
  try {
    const u = await requireUserOrg();
    userId = u.userId;
    orgId = u.orgId;
  } catch {
    return { ok: false, messageKey: "unauthorized" };
  }

  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)),
    columns: { id: true },
  });
  if (!ticket) return { ok: false, messageKey: "not_found" };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, messageKey: "missing_body" };

  await db.insert(ticketReplies).values({ ticketId, userId, body });
  revalidatePath(`/portal/tickets/${ticketId}`);
  return { ok: true, messageKey: "reply_sent" };
}
