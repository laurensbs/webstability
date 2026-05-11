"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ensureReferralCode } from "@/lib/db/queries/referrals";

/**
 * Geeft (of maakt) de referral-code voor de org van de ingelogde
 * owner. Gebruikt door de ReferralCard op /portal/dashboard om de
 * deelbare /refer/[code]-link te tonen. Geen demo-write-guard nodig —
 * dit is read-mostly (maakt hooguit één rij aan) en demo-orgs hebben
 * sowieso geen liveAt-90-dagen.
 */
export async function getMyReferralCode(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { organizationId: true, role: true, isDemo: true },
  });
  if (!user?.organizationId || user.role !== "owner" || user.isDemo) return null;
  return ensureReferralCode(user.organizationId);
}
