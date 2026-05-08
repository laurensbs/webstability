import { loginAsDemoPortal } from "@/app/actions/demo";

/**
 * Demo-portal entry. Route Handler (niet page) zodat we cookies mogen
 * setten — dat mag in Next 16 alleen vanuit een Server Action of Route
 * Handler, niet vanuit een Server Component render.
 *
 * `loginAsDemoPortal()` zet de sessie-cookie en gooit een `redirect()`
 * naar `/portal/dashboard`. De redirect-throw wordt door Next netjes
 * omgezet in een 307 response.
 */
export async function GET() {
  await loginAsDemoPortal();
}

export const dynamic = "force-dynamic";
