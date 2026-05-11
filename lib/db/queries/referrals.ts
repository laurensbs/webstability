import { randomBytes } from "node:crypto";
import { eq, isNull, isNotNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { referrals, organizations } from "@/lib/db/schema";

// base58-alfabet (Bitcoin-variant): geen 0/O/I/l zodat codes leesbaar
// blijven als iemand ze overtikt.
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/**
 * Geeft de bestaande referral-code van een org terug, of maakt er één
 * aan als die nog niet bestaat. Bij een (extreem onwaarschijnlijke)
 * code-collision wordt opnieuw geprobeerd. Idempotent — meerdere
 * gelijktijdige aanroepen geven dezelfde code dankzij de UNIQUE op
 * referrerOrgId (tweede insert faalt, we lezen 'm dan terug).
 */
export async function ensureReferralCode(orgId: string): Promise<string> {
  const existing = await db.query.referrals.findFirst({
    where: eq(referrals.referrerOrgId, orgId),
    columns: { code: true },
  });
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = base58(8);
    try {
      const [row] = await db
        .insert(referrals)
        .values({ code, referrerOrgId: orgId })
        .returning({ code: referrals.code });
      if (row) return row.code;
    } catch {
      // UNIQUE-violation op referrerOrgId (race) of op code (collision).
      // In beide gevallen: lees terug en probeer opnieuw.
      const reread = await db.query.referrals.findFirst({
        where: eq(referrals.referrerOrgId, orgId),
        columns: { code: true },
      });
      if (reread) return reread.code;
    }
  }
  throw new Error("could_not_generate_referral_code");
}

export async function getReferralByCode(code: string) {
  return db.query.referrals.findFirst({
    where: eq(referrals.code, code),
    columns: {
      id: true,
      code: true,
      referrerOrgId: true,
      convertedOrgId: true,
      discountAppliedAt: true,
    },
  });
}

/**
 * Markeert een referral als geconverteerd. No-op als de code niet
 * bestaat, al geconverteerd is, of de "converted" org dezelfde is als
 * de referrer (self-referral). Geeft `true` terug als er daadwerkelijk
 * geconverteerd werd.
 */
export async function markReferralConverted(
  code: string,
  convertedOrgId: string,
): Promise<boolean> {
  const row = await db.query.referrals.findFirst({
    where: eq(referrals.code, code),
    columns: { id: true, referrerOrgId: true, convertedOrgId: true },
  });
  if (!row) return false;
  if (row.convertedOrgId) return false;
  if (row.referrerOrgId === convertedOrgId) return false;

  await db
    .update(referrals)
    .set({ convertedOrgId, discountAppliedAt: new Date() })
    .where(eq(referrals.id, row.id));
  return true;
}

/**
 * Alle referrals voor /admin/referrals — code, referrer-org-naam,
 * status (pending | converted), datum. Read-only overzicht.
 */
export async function listAllReferrals() {
  const rows = await db
    .select({
      id: referrals.id,
      code: referrals.code,
      referrerOrgId: referrals.referrerOrgId,
      referrerName: organizations.name,
      convertedOrgId: referrals.convertedOrgId,
      discountAppliedAt: referrals.discountAppliedAt,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .leftJoin(organizations, eq(organizations.id, referrals.referrerOrgId))
    .orderBy(desc(referrals.createdAt));

  // Tweede pass: naam van de geconverteerde org ophalen (nullable).
  const convertedIds = rows.map((r) => r.convertedOrgId).filter((x): x is string => x !== null);
  const convertedNames = new Map<string, string>();
  if (convertedIds.length > 0) {
    const orgs = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations);
    for (const o of orgs) convertedNames.set(o.id, o.name);
  }

  return rows.map((r) => ({
    ...r,
    convertedName: r.convertedOrgId ? (convertedNames.get(r.convertedOrgId) ?? null) : null,
  }));
}

export async function getReferralStats() {
  const [pendingRows, convertedRows] = await Promise.all([
    db.select({ id: referrals.id }).from(referrals).where(isNull(referrals.convertedOrgId)),
    db.select({ id: referrals.id }).from(referrals).where(isNotNull(referrals.convertedOrgId)),
  ]);
  return { pending: pendingRows.length, converted: convertedRows.length };
}
