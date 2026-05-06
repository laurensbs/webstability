import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { VerifyPanel } from "@/components/auth/VerifyPanel";
import { MarkupText } from "@/components/animate/MarkupText";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.verify");
  const tFooter = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* LEFT — branded panel (matches login) */}
      <section className="relative hidden overflow-hidden bg-(--color-text) p-12 text-(--color-bg) md:flex md:flex-col md:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-40 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-50 blur-3xl"
        />

        <LoginAmbientMount className="pointer-events-none absolute inset-0 opacity-60" />

        <Link
          href="/"
          className="relative z-10 inline-block text-[20px] font-extrabold tracking-[-0.045em] text-(--color-bg)"
        >
          webstability<span className="text-(--color-accent)">.</span>
        </Link>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="text-3xl leading-[1.15] md:text-4xl">
            <MarkupText>{t("panelTitle")}</MarkupText>
          </h2>
          <p className="text-(--color-bg)/70">{t("panelLede")}</p>
        </div>

        <p className="relative z-10 font-mono text-xs tracking-widest text-(--color-bg)/45 uppercase">
          {"// "}
          {tFooter("tagline")}
        </p>
      </section>

      {/* RIGHT — verify content */}
      <section className="dotted-bg relative flex flex-col justify-between bg-(--color-bg) p-8 md:p-12">
        <header className="flex items-center justify-end">
          <LangSwitcher />
        </header>

        <div className="mx-auto w-full max-w-sm py-12">
          <VerifyPanel
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
            hint={t("hint")}
            resend={t("resend")}
          />
        </div>

        <footer className="flex items-center justify-between font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          <span>© {year} Webstability</span>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            </span>
            all systems go
          </span>
        </footer>
      </section>
    </main>
  );
}
