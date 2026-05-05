import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import NextLink from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { listPosts } from "@/lib/blog";

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

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl divide-y divide-(--color-border)">
          {posts.map((post, i) => (
            <RevealOnScroll key={post.slug} delay={i * 0.05}>
              <article className="py-8">
                <NextLink
                  href={locale === "nl" ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`}
                  className="group block space-y-3"
                >
                  <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                    {dateFmt.format(new Date(post.date))} ·{" "}
                    {t("readingTime", { minutes: post.readingMinutes })}
                  </p>
                  <h2 className="text-2xl transition-colors group-hover:text-(--color-accent) md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="text-(--color-muted)">{post.description}</p>
                </NextLink>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>
    </main>
  );
}
