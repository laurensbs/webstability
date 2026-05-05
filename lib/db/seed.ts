// Run via `pnpm db:seed` which uses tsx --env-file to load .env.local
// before this module imports db (ESM imports are hoisted, so dotenv inline doesn't help).
import { db } from "./index";
import { organizations, users, projects, tickets, invoices, subscriptions } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("seed: starting…");

  // org
  const orgSlug = "demo-bv";
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  let orgId: string;
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`seed: org "${orgSlug}" already exists, reusing`);
  } else {
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Demo BV",
        slug: orgSlug,
        country: "NL",
        vatNumber: "NL000000000B01",
        plan: "pro",
      })
      .returning({ id: organizations.id });
    orgId = org.id;
    console.log(`seed: org created ${orgId}`);
  }

  // owner user
  const ownerEmail = "owner@demo.test";
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, ownerEmail),
  });

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    console.log(`seed: user "${ownerEmail}" already exists, reusing`);
  } else {
    const [u] = await db
      .insert(users)
      .values({
        name: "Demo Owner",
        email: ownerEmail,
        emailVerified: new Date(),
        locale: "nl",
        role: "owner",
        organizationId: orgId,
      })
      .returning({ id: users.id });
    userId = u.id;
    console.log(`seed: user created ${userId}`);
  }

  // project
  const [project] = await db
    .insert(projects)
    .values({
      organizationId: orgId,
      name: "Demo verhuurplatform",
      type: "build",
      status: "in_progress",
      progress: 45,
      monitoringTargetUrl: "https://example.com",
    })
    .returning({ id: projects.id });
  console.log(`seed: project created ${project.id}`);

  // ticket
  await db.insert(tickets).values({
    organizationId: orgId,
    userId,
    projectId: project.id,
    subject: "Vraag over factuur",
    body: "Ik mis BTW-nummer op de PDF.",
    priority: "normal",
    status: "open",
  });
  console.log("seed: ticket created");

  // invoice
  await db.insert(invoices).values({
    organizationId: orgId,
    number: `WS-${Date.now()}`,
    amount: 95000, // €950.00
    vatAmount: 19950, // 21% BTW
    currency: "EUR",
    status: "sent",
    dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  console.log("seed: invoice created");

  // subscription
  await db.insert(subscriptions).values({
    organizationId: orgId,
    plan: "pro",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  console.log("seed: subscription created");

  console.log("seed: done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
