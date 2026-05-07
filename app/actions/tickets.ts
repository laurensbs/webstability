"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, count, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketReplies, users, organizations } from "@/lib/db/schema";
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

const CATEGORIES = ["bug", "feature", "question"] as const;
type Category = (typeof CATEGORIES)[number];

// Tier-aware open-ticket-budget. Bij overschrijden tonen we de klant
// een friendly waarschuwing op /portal/tickets/new; hij kan toch
// versturen met `force=1` — dan markeert overBudget=true voor staff.
const TIER_TICKET_LIMIT: Record<"care" | "studio" | "atelier", number> = {
  care: 3,
  studio: 8,
  atelier: Number.POSITIVE_INFINITY,
};

function categoryToPriority(c: Category): "low" | "normal" | "high" {
  if (c === "bug") return "high";
  if (c === "feature") return "normal";
  return "low";
}

export async function createTicket(formData: FormData) {
  const { userId, orgId } = await requireUserOrg();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryInput = String(formData.get("category") ?? "question");
  const category = (CATEGORIES as readonly string[]).includes(categoryInput)
    ? (categoryInput as Category)
    : "question";
  const force = formData.get("force") === "1";

  if (!subject || !body) throw new Error("missing_fields");

  // Tier-budget check
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { plan: true },
  });
  const limit = org?.plan ? TIER_TICKET_LIMIT[org.plan] : Number.POSITIVE_INFINITY;
  const [openCountRow] = await db
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), ne(tickets.status, "closed")));
  const openCount = Number(openCountRow?.n ?? 0);
  const overBudget = Number.isFinite(limit) && openCount >= limit;

  if (overBudget && !force) {
    // Geef de UI signal terug via thrown Error met code; client kan dan
    // de "stuur toch" knop tonen. We gebruiken redirect met query param
    // zodat het nieuwe-ticket-form de waarschuwing kan rendren.
    redirect(`/portal/tickets/new?warn=over-budget&open=${openCount}&limit=${limit}`);
  }

  const priority = categoryToPriority(category);

  const [created] = await db
    .insert(tickets)
    .values({
      organizationId: orgId,
      userId,
      subject,
      body,
      priority,
      status: "open",
      category,
      overBudget: Boolean(overBudget),
    })
    .returning({ id: tickets.id });

  revalidatePath("/portal/tickets");
  revalidatePath("/admin/tickets");
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
