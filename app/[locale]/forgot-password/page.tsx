import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { email } = await searchParams;

  const t = await getTranslations("auth.forgotPassword");
  const year = new Date().getFullYear();

  return (
    <main className="dotted-bg flex min-h-screen flex-col bg-(--color-bg)">
      <header className="flex items-center justify-between p-6 md:p-8">
        <Link
          href="/"
          className="inline-block text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text)"
        >
          webstability<span className="text-(--color-accent)">.</span>
        </Link>
        <LangSwitcher />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="rounded-panel shadow-card w-full max-w-sm border border-(--color-border) bg-(--color-surface) p-7 md:p-8">
          <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
            {"// "}
            {t("eyebrow")}
          </p>
          <h1 className="text-h3 mt-3">{t("title")}</h1>
          <p className="mt-2 mb-5 text-[15px] leading-[1.6] text-(--color-muted)">
            {t("subtitle")}
          </p>
          <ForgotPasswordForm
            defaultEmail={email ?? ""}
            strings={{
              emailLabel: t("emailLabel"),
              emailPlaceholder: t("emailPlaceholder"),
              submit: t("submit"),
              submitting: t("submitting"),
              sentTitle: t("sentTitle"),
              sentBody: t("sentBody"),
            }}
          />
          <p className="mt-5 text-center text-[13px] text-(--color-muted)">
            <Link href="/login" className="text-(--color-text) hover:text-(--color-accent)">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-center p-6 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        © {year} Webstability
      </footer>
    </main>
  );
}
