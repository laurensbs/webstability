import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2] ?? "hello@webstability.eu";
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: { organization: true },
  });

  console.log(
    JSON.stringify(
      {
        exists: !!user,
        email: user?.email,
        name: user?.name,
        role: user?.role,
        isStaff: user?.isStaff,
        organizationId: user?.organizationId,
        organizationName: user?.organization?.name,
        organizationPlan: user?.organization?.plan,
      },
      null,
      2,
    ),
  );
}
main().then(() => process.exit(0));
