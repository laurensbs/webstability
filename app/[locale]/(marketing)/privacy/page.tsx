import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader eyebrow="legal" title={t("privacyTitle")} />
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <p className="leading-relaxed text-(--color-muted)">{t("privacyBody")}</p>
        </div>
      </section>
    </main>
  );
}
