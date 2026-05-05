"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

export async function inviteMember(formData: FormData) {
  const { orgId } = await requireOwner();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleInput = String(formData.get("role") ?? "member");
  const role = (["owner", "member", "read_only"] as const).includes(
    roleInput as "owner" | "member" | "read_only",
  )
    ? (roleInput as "owner" | "member" | "read_only")
    : "member";

  if (!email || !email.includes("@")) throw new Error("invalid_email");

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    // If they already exist on a different org, don't steal them.
    if (existing.organizationId && existing.organizationId !== orgId) {
      throw new Error("already_in_org");
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
