import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { LangSwitcher } from "@/components/shared/LangSwitcher";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.login");
  const tFooter = await getTranslations("footer");
  const bullets = (await getTranslations()).raw("auth.login.panelBullets") as string[];
  const year = new Date().getFullYear();

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* LEFT — branded panel */}
      <section className="relative hidden overflow-hidden bg-(--color-text) p-12 text-(--color-bg) md:flex md:flex-col md:justify-between">
        {/* Ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-40 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-50 blur-3xl"
        />

        <Link
          href="/"
          className="relative z-10 inline-block text-[20px] font-extrabold tracking-[-0.045em] text-(--color-bg)"
        >
          webstability<span className="text-(--color-accent)">.</span>
        </Link>

        <div className="relative z-10 max-w-md space-y-8">
          <h2 className="text-3xl leading-[1.15] md:text-4xl">
            {t.rich("panelTitle", { em: (c) => <em>{c}</em> })}
          </h2>
          <p className="text-(--color-bg)/70">{t("panelLede")}</p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-(--color-bg)/85">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent)/20 text-(--color-accent)">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 font-mono text-xs tracking-widest text-(--color-bg)/45 uppercase">
          {"// "}
          {tFooter("tagline")}
        </p>
      </section>

      {/* RIGHT — login form */}
      <section className="dotted-bg relative flex flex-col justify-between bg-(--color-bg) p-8 md:p-12">
        <header className="flex items-center justify-between">
          <p className="text-sm text-(--color-muted)">
            {t("noAccount")}{" "}
            <Link href="/contact" className="text-(--color-text) hover:text-(--color-accent)">
              {t("contactCta")}
            </Link>
          </p>
          <LangSwitcher />
        </header>

        <div className="mx-auto w-full max-w-sm py-12">
          <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
            {"// "}
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl">
            {t.rich("title", { em: (c) => <em>{c}</em> })}
          </h1>
          <p className="mt-3 text-(--color-muted)">{t("subtitle")}</p>
          <div className="mt-8">
            <LoginForm />
          </div>
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
