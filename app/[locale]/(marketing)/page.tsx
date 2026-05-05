import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Hero } from "@/components/marketing/Hero";
import { LogoStrip } from "@/components/marketing/LogoStrip";
import { Services } from "@/components/marketing/Services";
import { Founder } from "@/components/marketing/Founder";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Approach } from "@/components/marketing/Approach";
import { PricingTeaser } from "@/components/marketing/PricingTeaser";
import { Audience } from "@/components/marketing/Audience";
import { FAQ } from "@/components/marketing/FAQ";
import { CTABlock } from "@/components/marketing/CTABlock";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <Hero />
      <LogoStrip />
      <Services />
      <Founder />
      {/* Testimonials renders nothing until messages.home.testimonials.items has entries. */}
      <Testimonials />
      <Approach />
      <PricingTeaser />
      <Audience />
      <FAQ />
      <CTABlock />
    </main>
  );
}
