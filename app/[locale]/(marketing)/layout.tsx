import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navigation } from "@/components/marketing/Navigation";
import { Footer } from "@/components/marketing/Footer";
import { SmoothScroll } from "@/components/animate/SmoothScroll";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("common");

  return (
    <>
      <SmoothScroll />
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      <Navigation />
      <div id="main">{children}</div>
      <Footer />
    </>
  );
}
