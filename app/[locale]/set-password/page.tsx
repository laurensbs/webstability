import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { token } = await searchParams;

  const t = await getTranslations("auth.setPassword");
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
          {!token ? (
            <div className="text-center">
              <h1 className="text-h3">{t("invalidTitle")}</h1>
              <p className="mt-3 text-[15px] leading-[1.6] text-(--color-muted)">
                {t("invalidBody")}
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[14px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
              >
                {t("requestNew")}
              </Link>
            </div>
          ) : (
            <>
              <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                {"// "}
                {t("eyebrow")}
              </p>
              <h1 className="text-h3 mt-3">{t("title")}</h1>
              <p className="mt-2 mb-5 text-[15px] leading-[1.6] text-(--color-muted)">
                {t("subtitle")}
              </p>
              <SetPasswordForm
                token={token}
                strings={{
                  passwordLabel: t("passwordLabel"),
                  passwordPlaceholder: t("passwordPlaceholder"),
                  confirmLabel: t("confirmLabel"),
                  submit: t("submit"),
                  submitting: t("submitting"),
                  mismatch: t("mismatch"),
                  tooShort: t("tooShort"),
                  invalidToken: t("invalidToken"),
                  genericError: t("genericError"),
                  successTitle: t("successTitle"),
                  successBody: t("successBody"),
                  goToLogin: t("goToLogin"),
                  minHint: t("minHint"),
                }}
              />
            </>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-center p-6 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        © {year} Webstability
      </footer>
    </main>
  );
}
