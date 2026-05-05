"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, organizationId: true, role: true },
  });
  if (!user?.organizationId) throw new Error("no_org");
  if (user.role !== "owner") throw new Error("forbidden");
  return { userId: user.id, orgId: user.organizationId };
}

export async function inviteMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let orgId: string;
  try {
    orgId = (await requireOwner()).orgId;
  } catch (err) {
    const m = err instanceof Error ? err.message : "forbidden";
    return { ok: false, messageKey: m };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleInput = String(formData.get("role") ?? "member");
  const role = (["owner", "member", "read_only"] as const).includes(
    roleInput as "owner" | "member" | "read_only",
  )
    ? (roleInput as "owner" | "member" | "read_only")
    : "member";

  if (!email || !email.includes("@")) return { ok: false, messageKey: "invalid_email" };

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    if (existing.organizationId && existing.organizationId !== orgId) {
      return { ok: false, messageKey: "already_in_org" };
    }
    await db.update(users).set({ organizationId: orgId, role }).where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      email,
      organizationId: orgId,
      role,
      locale: "nl",
    });
  }

  revalidatePath("/portal/team");
  return { ok: true, messageKey: "invited" };
}

export async function removeMember(userIdToRemove: string) {
  const { userId, orgId } = await requireOwner();
  if (userIdToRemove === userId) throw new Error("cant_remove_self");

  await db
    .update(users)
    .set({ organizationId: null })
    .where(and(eq(users.id, userIdToRemove), eq(users.organizationId, orgId)));

  revalidatePath("/portal/team");
}
