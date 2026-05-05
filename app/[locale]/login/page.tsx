import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.login");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-2xl font-extrabold tracking-tight">
            webstability<span className="text-(--color-accent)">.</span>
          </p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="text-(--color-muted)">{t("subtitle")}</p>
        </div>
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
