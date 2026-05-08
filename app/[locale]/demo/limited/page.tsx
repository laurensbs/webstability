import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

/**
 * Friendly fallback wanneer rate-limit hit OF demo-seed nog niet
 * gedraaid is in deze omgeving. Stuurt bezoeker terug naar marketing
 * met een duidelijke uitleg.
 */
export default async function DemoLimitedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string; role?: string }>;
}) {
  const { locale } = await params;
  const { reason, role } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("demo.limited");
  // Diagnostische hint — alleen voor staff-bezoek zichtbaar via query.
  // "missing" = demo-seed nog niet gedraaid in deze omgeving.
  // "rate-limit" = >10 demo-logins per uur vanaf dit IP.
  const debugHint =
    reason === "missing"
      ? `Demo-${role ?? "user"} ontbreekt — run \`pnpm db:seed:demo\` op productie.`
      : reason === "rate-limit"
        ? "Rate-limit (10 demo-logins per uur per IP) bereikt."
        : null;

  return (
    <main className="dotted-bg flex min-h-screen flex-1 items-center justify-center px-6 py-20">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-8 text-center md:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
          <Clock className="h-5 w-5" />
        </span>
        <div className="space-y-3">
          <h1 className="font-serif text-3xl">{t("title")}</h1>
          <p className="text-[15px] leading-[1.6] text-(--color-muted)">{t("body")}</p>
          {debugHint ? (
            <p className="rounded-md border border-(--color-border) bg-(--color-bg-warm) px-3 py-2 font-mono text-[11px] text-(--color-muted)">
              {debugHint}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Button asChild variant="primary">
            <Link href="/contact">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">{t("ctaSecondary")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
