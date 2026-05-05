import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { listPosts, type BlogPost } from "@/lib/blog";
import { MarkupText } from "@/components/animate/MarkupText";

function postHref(locale: string, slug: string) {
  return locale === "nl" ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const posts = await listPosts(locale as "nl" | "es");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [featured, ...rest] = posts;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-10">
          {featured ? (
            <RevealOnScroll>
              <FeaturedCard
                post={featured}
                locale={locale}
                dateFmt={dateFmt}
                readingLabel={(m) => t("readingTime", { minutes: m })}
                featuredLabel={t("featured")}
              />
            </RevealOnScroll>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {rest.map((post, i) => (
                <RevealOnScroll key={post.slug} delay={i * 0.05}>
                  <PostCard
                    post={post}
                    locale={locale}
                    dateFmt={dateFmt}
                    readingLabel={(m) => t("readingTime", { minutes: m })}
                  />
                </RevealOnScroll>
              ))}
            </div>
          ) : null}

          {posts.length === 0 ? (
            <p className="text-center text-(--color-muted)">{t("empty")}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FeaturedCard({
  post,
  locale,
  dateFmt,
  readingLabel,
  featuredLabel,
}: {
  post: BlogPost;
  locale: string;
  dateFmt: Intl.DateTimeFormat;
  readingLabel: (m: number) => string;
  featuredLabel: string;
}) {
  return (
    <NextLink
      href={postHref(locale, post.slug)}
      className="group relative block overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-8 transition-shadow duration-300 hover:shadow-[0_16px_40px_-20px_rgba(31,27,22,0.18)] md:p-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-(--color-accent-soft) opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
      />
      <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-end">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-(--color-accent-soft) px-3 py-1 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            ★ {featuredLabel}
          </span>
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {dateFmt.format(new Date(post.date))} · {readingLabel(post.readingMinutes)}
          </p>
          <h2 className="text-3xl leading-[1.1] transition-colors group-hover:text-(--color-accent) md:text-5xl">
            {post.title}
          </h2>
          <p className="max-w-2xl text-(--color-muted) md:text-lg">{post.description}</p>
        </div>
        <ArrowUpRight className="h-8 w-8 text-(--color-muted) transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--color-accent) md:self-end" />
      </div>
    </NextLink>
  );
}

function PostCard({
  post,
  locale,
  dateFmt,
  readingLabel,
}: {
  post: BlogPost;
  locale: string;
  dateFmt: Intl.DateTimeFormat;
  readingLabel: (m: number) => string;
}) {
  return (
    <NextLink
      href={postHref(locale, post.slug)}
      className="group relative block h-full overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-7 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]"
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 bg-(--color-accent) transition-transform duration-500 ease-out group-hover:scale-y-100"
      />
      <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        {dateFmt.format(new Date(post.date))} · {readingLabel(post.readingMinutes)}
      </p>
      <h3 className="mt-3 text-xl transition-colors group-hover:text-(--color-accent) md:text-2xl">
        {post.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{post.description}</p>
    </NextLink>
  );
}
