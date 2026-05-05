import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

// Placeholder homepage — Phase 1 only verifies theme, typography, i18n,
// and the marketing layout shell. Real sections land in Phase 2.

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-32">
      <div className="max-w-2xl space-y-6">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-5xl leading-tight md:text-7xl">
          {t.rich("headline", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>
        <p className="text-lg text-(--color-muted)">{t("tagline")}</p>
      </div>
    </main>
  );
}
