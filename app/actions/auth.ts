"use server";

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";

export async function signInAction(email: string) {
  // Admin host routes the post-login redirect to /admin instead of
  // the customer portal. The proxy then rewrites it transparently.
  const host = (await headers()).get("host") ?? "";
  const isAdminHost = host.toLowerCase().startsWith("admin.");
  const redirectTo = isAdminHost ? "/admin" : "/portal/dashboard";

  try {
    await signIn("nodemailer", { email, redirectTo });
  } catch (err) {
    // Auth.js throws a redirect-like error on success; only surface real errors.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: true };
  }
}
