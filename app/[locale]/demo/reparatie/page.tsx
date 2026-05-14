import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReparatieDemo } from "@/components/marketing/demos/ReparatieDemo";

export const metadata: Metadata = {
  title: "Demo · Reparatie-portaal | Webstability",
  description:
    "Geanonimiseerde demo van een reparatie-werkplaatssysteem met werkbonnen, status-tracking en iPad-flow.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <ReparatieDemo />;
}
