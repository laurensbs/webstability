// Wachtwoord-hashing + set/reset-tokens. Bewust apart van lib/auth.ts:
// Auth.js draait z'n config deels in de edge-runtime (middleware), bcryptjs
// niet — deze module wordt alleen vanuit Node-runtime server-actions
// geïmporteerd.

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const ROUNDS = 10;

/** Minimale wachtwoord-eis: 8 tekens. Geen complexiteits-regels — een
 * langere passphrase is veiliger én gebruiksvriendelijker. */
export const PASSWORD_MIN_LENGTH = 8;

export function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && pw.length >= PASSWORD_MIN_LENGTH && pw.length <= 200;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, ROUNDS);
}

export async function verifyPassword(
  pw: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(pw, hash);
  } catch {
    return false;
  }
}

/** URL-veilige eenmalige token voor een set/reset-link. */
export function newSetupToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Geldigheidsduur van een set/reset-token. */
export const SETUP_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 dagen
