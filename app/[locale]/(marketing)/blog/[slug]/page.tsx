import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPosts, getPost, type BlogPost } from "@/lib/blog";

export const dynamicParams = true;

export async function generateStaticParams() {
  const params: Array<{ slug: string }> = [];
  for (const locale of routing.locales) {
    const posts = await listPosts(locale);
    for (const p of posts) params.push({ slug: p.slug });
  }
  return params;
}

function postHref(locale: string, slug: string) {
  return locale === "nl" ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [post, allPosts] = await Promise.all([
    getPost(locale as "nl" | "es", slug),
    listPosts(locale as "nl" | "es"),
  ]);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // posts are sorted desc by date — find neighbours
  const idx = allPosts.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? allPosts[idx - 1] : null;
  const older = idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const initials = post.author
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <article className="px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <Link
            href={{ pathname: "/blog" }}
            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-accent)"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("back")}
          </Link>

          <header className="mt-8 space-y-6">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {dateFmt.format(new Date(post.date))} ·{" "}
              {t("readingTime", { minutes: post.readingMinutes })}
            </p>
            <h1 className="text-4xl leading-[1.1] md:text-6xl">{post.title}</h1>
            <p className="text-lg text-(--color-muted)">{post.description}</p>
          </header>

          <div className="prose-wb mt-12 [&_a]:text-(--color-accent) [&_a]:underline [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-2xl [&_hr]:my-12 [&_hr]:border-(--color-border) [&_li]:my-2 [&_p]:mt-5 [&_p]:leading-relaxed [&_p]:text-(--color-muted) [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-(--color-muted)">
            <MDXRemote source={post.content} />
          </div>

          {/* Author block */}
          <div className="mt-16 flex items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-(--color-accent) to-(--color-teal) font-mono text-sm text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{post.author}</p>
              <p className="font-mono text-xs text-(--color-muted)">{t("by")} · webstability.eu</p>
            </div>
          </div>

          {/* Prev / next */}
          {(newer || older) && (
            <nav className="mt-8 grid gap-3 sm:grid-cols-2">
              {newer ? (
                <NeighbourLink post={newer} locale={locale} label={t("next")} direction="next" />
              ) : (
                <span aria-hidden />
              )}
              {older ? (
                <NeighbourLink
                  post={older}
                  locale={locale}
                  label={t("previous")}
                  direction="prev"
                />
              ) : null}
            </nav>
          )}
        </div>
      </article>
    </main>
  );
}

function NeighbourLink({
  post,
  locale,
  label,
  direction,
}: {
  post: BlogPost;
  locale: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <NextLink
      href={postHref(locale, post.slug)}
      className={`group relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)] ${
        direction === "next" ? "" : "sm:text-right"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0 ${direction === "next" ? "left-0" : "right-0"} h-full w-[3px] origin-top scale-y-0 bg-(--color-accent) transition-transform duration-500 ease-out group-hover:scale-y-100`}
      />
      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {direction === "next" ? `← ${label}` : `${label} →`}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-medium transition-colors group-hover:text-(--color-accent)">
        {post.title}
      </p>
    </NextLink>
  );
}
