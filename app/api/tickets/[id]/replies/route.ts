import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketReplies, users } from "@/lib/db/schema";

/**
 * Polling endpoint voor ticket-replies. Klant-portal én admin pollen
 * deze elke 10s om real-time replies te zien zonder WebSocket-setup.
 * Auth-check: ofwel staff (mag elke ticket), of de owner-org van het
 * ticket. Returnt minimaal — geen attachments-payload, alleen body +
 * author-naam + timestamp zodat de UI scroll-detect kan doen.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, organizationId: true, isStaff: true },
  });
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, id),
    columns: { id: true, organizationId: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!me.isStaff && ticket.organizationId !== me.organizationId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const replies = await db.query.ticketReplies.findMany({
    where: and(eq(ticketReplies.ticketId, id)),
    orderBy: [asc(ticketReplies.createdAt)],
    with: {
      user: { columns: { id: true, name: true, email: true, isStaff: true } },
    },
  });

  return NextResponse.json({
    replies: replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        isStaff: r.user.isStaff,
      },
    })),
  });
}
