/**
 * Write-guard voor demo-mode. Server-actions die mutaties doen roepen
 * `assertNotDemo(userId)` aan na hun reguliere auth-check; als de user
 * `isDemo=true` is throwt deze functie een `DemoReadonlyError`. De
 * higher-order helper `withDemoReadonly()` vangt dat netjes af en
 * returnt een ActionResult zodat de bestaande ToastForm-toast-flow er
 * automatisch op reageert.
 *
 * NIET in lib/auth.ts geïntegreerd — auth-flow zelf moet niet weten
 * van demo-state. Alleen mutatie-paths consulteren deze guard.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

export class DemoReadonlyError extends Error {
  constructor() {
    super("demo_readonly");
    this.name = "DemoReadonlyError";
  }
}

/**
 * Throw als de user de demo-flag heeft. Server-actions roepen dit
 * aan na requireStaff/requireUserOrg/requireOwner zodat alleen reguliere
 * gebruikers schrijven.
 */
export async function assertNotDemo(userId: string): Promise<void> {
  const u = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isDemo: true },
  });
  if (u?.isDemo) {
    throw new DemoReadonlyError();
  }
}

/**
 * Higher-order wrapper voor server-actions die ActionResult returnen.
 * Vangt DemoReadonlyError af en zet 'm om naar een succesvolle toast
 * met de demo_readonly key. Andere errors herrijst hij — die blijven
 * in de bestaande catch-flow zitten.
 */
export async function withDemoReadonly<T extends ActionResult>(
  fn: () => Promise<T>,
): Promise<T | ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof DemoReadonlyError) {
      return { ok: true, messageKey: "demo_readonly" };
    }
    throw e;
  }
}
