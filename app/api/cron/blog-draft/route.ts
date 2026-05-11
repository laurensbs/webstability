import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogDrafts } from "@/lib/db/schema";
import { BLOG_TOPIC_SEEDS } from "@/lib/blog/topics";
import { generateBlogDraft } from "@/lib/blog/generate";
import { sendBlogDraftMail } from "@/lib/email/blog-draft";

/**
 * Wekelijkse blog-conceptgenerator — runt maandag 06:00 (Vercel cron).
 *
 * Stappen:
 *  1. Upsert de seed-onderwerpen uit `lib/blog/topics.ts` naar de
 *     `blog_drafts`-tabel (op slug; bestaande rijen blijven ongemoeid).
 *  2. Pak de oudste 'pending' rij (laagste priority, dan oudste).
 *     Niets pending? Klaar, niks te doen.
 *  3. Roep de Anthropic API aan → volledige MDX.
 *  4. Sla MDX op, zet status 'generated', mail Laurens met de MDX.
 *  5. Mislukt de generatie? Status 'failed' + error, geen mail.
 *
 * Bewust GEEN auto-publish: Vercel's FS is read-only at runtime en de
 * merkstem wil review. Laurens kopieert de MDX uit de mail naar
 * content/blog/nl/[slug].mdx en commit; daarna mag hij de rij op
 * 'published' zetten (of een latere admin-actie doet dat).
 *
 * Eén concept per run — bewust traag, ~1 post per week.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function syncSeeds(): Promise<void> {
  for (const seed of BLOG_TOPIC_SEEDS) {
    await db
      .insert(blogDrafts)
      .values({
        slug: seed.slug,
        title: seed.title,
        targetKeywords: seed.targetKeywords,
        brief: seed.brief,
        priority: seed.priority ?? 100,
      })
      .onConflictDoNothing({ target: blogDrafts.slug });
  }
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, reason: "no-api-key" }, { status: 200 });
  }

  await syncSeeds();

  const next = await db.query.blogDrafts.findFirst({
    where: eq(blogDrafts.status, "pending"),
    orderBy: [asc(blogDrafts.priority), asc(blogDrafts.createdAt)],
  });

  if (!next) {
    return NextResponse.json({ ok: true, generated: null, reason: "queue-empty" });
  }

  try {
    const { bodyMdx, model } = await generateBlogDraft({
      slug: next.slug,
      title: next.title,
      targetKeywords: next.targetKeywords,
      brief: next.brief,
    });

    await db
      .update(blogDrafts)
      .set({
        status: "generated",
        bodyMdx,
        model,
        error: null,
        generatedAt: sql`now()`,
      })
      .where(and(eq(blogDrafts.id, next.id), eq(blogDrafts.status, "pending")));

    try {
      await sendBlogDraftMail({
        slug: next.slug,
        title: next.title,
        targetKeywords: next.targetKeywords,
        bodyMdx,
        model,
      });
    } catch (mailErr) {
      // Concept is opgeslagen; alleen de mail mislukte — log en ga door.
      console.error(`[blog-draft] mail for ${next.slug} failed:`, mailErr);
    }

    return NextResponse.json({ ok: true, generated: next.slug, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(blogDrafts)
      .set({ status: "failed", error: message.slice(0, 1000) })
      .where(eq(blogDrafts.id, next.id));
    console.error(`[blog-draft] generation for ${next.slug} failed:`, err);
    return NextResponse.json({ ok: false, slug: next.slug, error: message }, { status: 200 });
  }
}
