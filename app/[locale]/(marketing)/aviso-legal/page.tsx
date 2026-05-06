import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "avisoLegal");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader eyebrow="legal" title={t("avisoTitle")} />
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <p className="leading-relaxed text-(--color-muted)">{t("avisoBody")}</p>
        </div>
      </section>
    </main>
  );
}
