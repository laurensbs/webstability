import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navigation } from "@/components/marketing/Navigation";
import { Footer } from "@/components/marketing/Footer";
import { MobileStickyCta } from "@/components/marketing/MobileStickyCta";
import { SmoothScroll } from "@/components/animate/SmoothScroll";
import { AmbientCanvas } from "@/components/r3f/AmbientCanvas";
import { BodyBackgroundToggle } from "@/components/r3f/BodyBackgroundToggle";

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
  const tNav = await getTranslations("nav");

  return (
    <>
      {/*
        Mark the marketing surface so globals.css can drop the body's
        cream background and let the shader through. Unmounts cleanly
        when navigating to portal/admin where body keeps its solid bg.
      */}
      <BodyBackgroundToggle />
      <AmbientCanvas />
      <SmoothScroll />
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      <Navigation />
      <div id="main" className="relative z-[1]">
        {children}
      </div>
      <Footer />
      <MobileStickyCta planLabel={tNav("planCall")} whatsappLabel={tNav("whatsapp")} />
    </>
  );
}
