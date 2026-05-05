import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";

export default async function SeoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("portal.seo");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
      <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 p-8">
        <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
          {t("comingSoon")}
        </p>
        <p className="mt-4 leading-relaxed text-(--color-muted)">{t("body")}</p>
        <p className="mt-4 font-mono text-xs text-(--color-muted)">{t("configure")}</p>
      </div>
    </div>
  );
}
