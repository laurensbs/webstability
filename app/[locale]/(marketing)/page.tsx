import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { pageMetadata, organizationLd, localBusinessLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/marketing/Hero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "home");
}
import { LogoStrip } from "@/components/marketing/LogoStrip";
import { HowItWorksWrapper } from "@/components/marketing/HowItWorksWrapper";
import { StudioStatement } from "@/components/marketing/StudioStatement";
import { Services } from "@/components/marketing/Services";
import { Founder } from "@/components/marketing/Founder";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Approach } from "@/components/marketing/Approach";
import { FAQ } from "@/components/marketing/FAQ";
import { CTABlock } from "@/components/marketing/CTABlock";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={organizationLd(locale)} />
      <JsonLd data={localBusinessLd(locale)} />
      <Hero />
      <LogoStrip />
      <HowItWorksWrapper />
      <StudioStatement />
      <Services />
      <Founder />
      {/* Testimonials renders nothing until messages.home.testimonials.items has entries. */}
      <Testimonials />
      <Approach />
      <FAQ />
      <CTABlock />
    </main>
  );
}
