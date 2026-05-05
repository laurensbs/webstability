import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.verify");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
        <p className="text-sm text-(--color-muted)">{t("hint")}</p>
      </div>
    </main>
  );
}
