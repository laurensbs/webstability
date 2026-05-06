// Run via: pnpm exec tsx --env-file=.env.local scripts/clear-plan.ts <email>
// Zet het plan van de organisatie van deze user op null zodat je 'm
// schoon kunt testen via Stripe checkout.
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("usage: pnpm exec tsx scripts/clear-plan.ts <email>");
    process.exit(1);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    columns: { id: true, organizationId: true },
  });

  if (!user?.organizationId) {
    console.error(`No org for ${email}`);
    process.exit(1);
  }

  await db
    .update(organizations)
    .set({ plan: null, planStartedAt: null })
    .where(eq(organizations.id, user.organizationId));

  console.log(`✓ Plan cleared for ${email}'s org (${user.organizationId})`);
}
main().then(() => process.exit(0));
