import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { CalEmbed } from "@/components/marketing/CalEmbed";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("contact");

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          <CalEmbed locale={locale} />
        </div>
        <p className="mx-auto mt-6 max-w-5xl text-center font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("calFallback")}
        </p>
      </section>
    </main>
  );
}
