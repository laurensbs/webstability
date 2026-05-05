import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPosts, getPost } from "@/lib/blog";

export const dynamicParams = true;

export async function generateStaticParams() {
  const params: Array<{ slug: string }> = [];
  for (const locale of routing.locales) {
    const posts = await listPosts(locale);
    for (const p of posts) params.push({ slug: p.slug });
  }
  return params;
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const post = await getPost(locale as "nl" | "es", slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <article className="px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <Link
            href={{ pathname: "/blog" }}
            className="font-mono text-xs tracking-widest text-(--color-muted) uppercase hover:text-(--color-accent)"
          >
            ← {t("back")}
          </Link>

          <header className="mt-8 space-y-6">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {dateFmt.format(new Date(post.date))} ·{" "}
              {t("readingTime", { minutes: post.readingMinutes })}
            </p>
            <h1 className="text-4xl leading-[1.1] md:text-6xl">{post.title}</h1>
            <p className="text-lg text-(--color-muted)">{post.description}</p>
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {t("by")} {post.author}
            </p>
          </header>

          <div className="prose prose-neutral mt-12 max-w-none [&_a]:text-(--color-accent) [&_a]:underline [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-medium [&_h3]:mt-8 [&_h3]:text-xl [&_hr]:my-12 [&_hr]:border-(--color-border) [&_li]:my-2 [&_p]:mt-5 [&_p]:leading-relaxed [&_p]:text-(--color-muted) [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-(--color-muted)">
            <MDXRemote source={post.content} />
          </div>
        </div>
      </article>
    </main>
  );
}
