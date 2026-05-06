// Run via `pnpm db:promote-staff <email>`. Marks the user as staff so
// they get access to /admin. If the user doesn't exist yet, creates a
// stub row — the next magic-link login will populate name/avatar.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("usage: pnpm db:promote-staff <email>");
    process.exit(1);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, isStaff: true, organizationId: true },
  });

  if (existing) {
    if (existing.isStaff) {
      console.log(`✓ ${email} is already staff (id ${existing.id}).`);
      return;
    }
    await db.update(users).set({ isStaff: true, role: "owner" }).where(eq(users.id, existing.id));
    console.log(`✓ promoted ${email} to staff.`);
    return;
  }

  // No user yet. Auth.js requires a row before magic-link login can
  // attach to it; create one here so the first login goes straight to
  // /admin without needing a self-signup flow.
  //
  // The admin layout requires both isStaff AND a session — but does
  // NOT require organizationId. We still attach to a "Webstability"
  // org if one exists so other queries don't trip on null.
  const studio = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "webstability"),
    columns: { id: true },
  });

  let orgId = studio?.id ?? null;
  if (!orgId) {
    const [created] = await db
      .insert(organizations)
      .values({
        name: "Webstability",
        slug: "webstability",
        country: "ES",
        plan: "atelier",
      })
      .returning({ id: organizations.id });
    orgId = created.id;
    console.log(`+ created studio org ${orgId}.`);
  }

  const [u] = await db
    .insert(users)
    .values({
      email,
      emailVerified: new Date(),
      locale: "nl",
      role: "owner",
      isStaff: true,
      organizationId: orgId,
    })
    .returning({ id: users.id });
  console.log(`✓ created staff user ${u.id} for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
