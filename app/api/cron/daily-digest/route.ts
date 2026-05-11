import { NextResponse } from "next/server";
import { getDailyDigest } from "@/lib/db/queries/admin";
import { sendDailyDigest } from "@/lib/email/staff-digest";

/**
 * Dagelijkse digest-cron — runt 07:00 (Vercel cron-config). Bundelt
 * alles waar Laurens actie op moet ondernemen (leads om op te volgen,
 * aankomende calls, ingevulde intakes, projecten op review, high-
 * priority tickets, stille build-projecten) en mailt het naar
 * STAFF_NOTIFY_EMAIL. Eén mail i.p.v. vijf admin-widgets checken.
 *
 * Stuurt niets als er niets te doen is — een lege "vandaag voor jou"-
 * mail is alleen ruis.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const digest = await getDailyDigest();
  if (!digest.hasAnything) {
    return NextResponse.json({ ok: true, sent: false, reason: "nothing-to-do" });
  }

  try {
    await sendDailyDigest({
      leads: digest.leads,
      upcomingCalls: digest.upcomingCalls,
      submittedIntakes: digest.submittedIntakes,
      projectsInReview: digest.projectsInReview,
      highPriorityTickets: digest.highPriorityTickets,
      staleProjects: digest.staleProjects,
    });
  } catch (err) {
    console.error("[daily-digest] send failed:", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    counts: {
      leads: digest.leads.length,
      calls: digest.upcomingCalls.length,
      intakes: digest.submittedIntakes.length,
      review: digest.projectsInReview.length,
      tickets: digest.highPriorityTickets.length,
      stale: digest.staleProjects.length,
    },
  });
}
