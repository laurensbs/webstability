import { NextResponse } from "next/server";
import { eq, ilike, or, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, tickets, projects } from "@/lib/db/schema";

/**
 * Cmd+K search endpoint voor /admin. Fuzzy-matched op org-naam,
 * ticket-subject, project-naam. Auth-vereist (isStaff). Returnt
 * max 8 resultaten in 1 query per kind voor snelheid.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { isStaff: true },
  });
  if (!me?.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  const pattern = `%${q}%`;

  const [orgRows, ticketRows, projectRows] = await Promise.all([
    db
      .select({ id: organizations.id, name: organizations.name, country: organizations.country })
      .from(organizations)
      .where(or(ilike(organizations.name, pattern), ilike(organizations.slug, pattern)))
      .limit(5),
    db
      .select({ id: tickets.id, subject: tickets.subject, orgId: tickets.organizationId })
      .from(tickets)
      .where(and(ilike(tickets.subject, pattern)))
      .limit(5),
    db
      .select({ id: projects.id, name: projects.name, orgId: projects.organizationId })
      .from(projects)
      .where(ilike(projects.name, pattern))
      .limit(5),
  ]);

  const results = [
    ...orgRows.map((o) => ({
      kind: "org" as const,
      id: o.id,
      title: o.name,
      subtitle: o.country,
    })),
    ...ticketRows.map((t) => ({
      kind: "ticket" as const,
      id: t.id,
      title: t.subject,
      subtitle: t.orgId,
    })),
    ...projectRows.map((p) => ({
      kind: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: p.orgId,
    })),
  ];

  return NextResponse.json({ results });
}
