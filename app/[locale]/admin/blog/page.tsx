import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { blogDrafts } from "@/lib/db/schema";
import { BlogDraftQueue } from "@/components/admin/BlogDraftQueue";
import {
  triggerBlogDraftGeneration,
  markBlogDraftPublished,
  markBlogDraftSkipped,
  retryBlogDraft,
} from "@/app/actions/blog-drafts";

/**
 * /admin/blog — content-engine cockpit. Toont de wekelijkse AI-blog-
 * conceptwachtrij (uit de blog_drafts-tabel) met statussen, een
 * "Genereer nu"-knop die de cron handmatig triggert, en per gegenereerd
 * concept: kopieer-MDX + markeer-gepubliceerd/afgekeurd. Onderwerpen
 * toevoegen blijft via lib/blog/topics.ts (gesynct bij elke cron-run).
 *
 * Sortering: 'generated' bovenaan (review nodig), dan 'pending' (op
 * priority), dan de rest op datum.
 */
export default async function AdminBlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const rows = await db.query.blogDrafts.findMany({
    orderBy: [asc(blogDrafts.priority), desc(blogDrafts.createdAt)],
  });

  // Statusvolgorde: review-nodig eerst, dan wachtrij, dan afgehandeld.
  const order: Record<string, number> = {
    generated: 0,
    failed: 1,
    pending: 2,
    skipped: 3,
    published: 4,
  };
  const sorted = [...rows].sort((a, b) => {
    const sa = order[a.status] ?? 9;
    const sb = order[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    if (a.status === "pending") return a.priority - b.priority;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="inline-flex items-center gap-3 font-serif text-[clamp(28px,4vw,38px)] leading-tight">
          <Sparkles className="h-7 w-7 text-(--color-wine)" strokeWidth={2} />
          Blog-conceptengine
        </h1>
        <p className="mt-2 max-w-prose text-[14px] text-(--color-muted)">
          Elke maandag 06:00 pakt de cron het oudste onderwerp uit de wachtrij, laat Claude een
          NL-concept schrijven in de huisstijl, slaat het op en mailt het je. Reviewen, eventueel
          bijschaven, in <code className="font-mono text-[12px]">content/blog/nl/[slug].mdx</code>{" "}
          zetten, <code className="font-mono text-[12px]">pnpm build</code>, committen — daarna hier
          op &ldquo;Gepubliceerd&rdquo; klikken. Onderwerp toevoegen:{" "}
          <code className="font-mono text-[12px]">lib/blog/topics.ts</code>.
        </p>
      </div>

      <BlogDraftQueue
        drafts={sorted.map((d) => ({
          id: d.id,
          slug: d.slug,
          title: d.title,
          targetKeywords: d.targetKeywords,
          priority: d.priority,
          status: d.status,
          bodyMdx: d.bodyMdx,
          model: d.model,
          error: d.error,
          createdAt: d.createdAt,
          generatedAt: d.generatedAt,
        }))}
        actions={{
          generate: triggerBlogDraftGeneration,
          markPublished: markBlogDraftPublished,
          markSkipped: markBlogDraftSkipped,
          retry: retryBlogDraft,
        }}
      />
    </div>
  );
}
