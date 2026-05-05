import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("guarantees");
  const tRaw = await getTranslations();
  const promises = tRaw.raw("guarantees.promises") as Array<{ title: string; body: string }>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      <section className="px-6 pb-16">
        <RevealOnScroll className="mx-auto max-w-4xl rounded-lg border border-(--color-border) bg-(--color-surface) p-8 md:p-12">
          <h2 className="text-2xl">{t("ndaTitle")}</h2>
          <p className="mt-4 leading-relaxed text-(--color-muted)">{t("ndaBody")}</p>
        </RevealOnScroll>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          {promises.map((p, i) => (
            <RevealOnScroll key={i} delay={i * 0.06} className="space-y-2">
              <h3 className="text-xl">{p.title}</h3>
              <p className="text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
            </RevealOnScroll>
          ))}
        </div>
      </section>
    </main>
  );
}
