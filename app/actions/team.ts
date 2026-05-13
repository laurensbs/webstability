"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { sendPortalInviteMail } from "@/lib/email/portal-invite";
import type { ActionResult } from "@/lib/action-result";

const ROLES = ["owner", "member", "read_only"] as const;
type Role = (typeof ROLES)[number];

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, email: true, organizationId: true, role: true },
  });
  if (!user?.organizationId) throw new Error("no_org");
  if (user.role !== "owner") throw new Error("forbidden");
  return {
    userId: user.id,
    orgId: user.organizationId,
    inviterName: user.name,
    inviterEmail: user.email,
  };
}

export async function inviteMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let orgId: string;
  let inviterName: string | null = null;
  let inviterEmail: string | null = null;
  try {
    const o = await requireOwner();
    orgId = o.orgId;
    inviterName = o.inviterName;
    inviterEmail = o.inviterEmail;
  } catch (err) {
    const m = err instanceof Error ? err.message : "forbidden";
    return { ok: false, messageKey: m };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleInput = String(formData.get("role") ?? "member");
  const role: Role = (ROLES as readonly string[]).includes(roleInput)
    ? (roleInput as Role)
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

  // Stuur de portal-invite mail. Faalt graceful — de user is al
  // toegevoegd, dus een mislukte mail mag de actie niet kapot maken.
  // De owner ziet 'm gewoon in de team-lijst verschijnen.
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { name: true, country: true },
    });
    // Locale-keuze: als de invitee al een account had met een locale,
    // gebruik die. Anders: ES als de org Spaans is, anders NL.
    const inviteeLocale = existing?.locale ?? (org?.country === "ES" ? "es" : "nl");
    await sendPortalInviteMail({
      to: email,
      orgName: org?.name ?? "je organisatie",
      inviterName,
      inviterEmail,
      role,
      locale: inviteeLocale,
    });
  } catch (err) {
    console.error("[team] invite mail failed:", err);
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

/**
 * Owner promotes/demotes een teamlid. Self-demote is geblokkeerd —
 * anders blijft de org zonder owner achter (eerst iemand anders
 * promoten, dan jezelf eventueel verwijderen). Owners kunnen elkaar
 * onderling wel demoten.
 */
export async function changeMemberRole(userIdToChange: string, newRole: Role): Promise<void> {
  const { userId, orgId } = await requireOwner();
  if (!(ROLES as readonly string[]).includes(newRole)) throw new Error("invalid_role");
  if (userIdToChange === userId && newRole !== "owner") {
    throw new Error("cant_self_demote");
  }
  await db
    .update(users)
    .set({ role: newRole })
    .where(and(eq(users.id, userIdToChange), eq(users.organizationId, orgId)));

  revalidatePath("/portal/team");
}
