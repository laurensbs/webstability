import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.verify");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <AuthCard title={t("title")} subtitle={t("subtitle")} hint={t("hint")} />
    </main>
  );
}
