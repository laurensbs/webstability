"use server";

import { signIn } from "@/lib/auth";

export async function signInAction(email: string) {
  try {
    await signIn("nodemailer", { email, redirectTo: "/portal/dashboard" });
  } catch (err) {
    // Auth.js throws a redirect-like error on success; only surface real errors.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: true };
  }
}
