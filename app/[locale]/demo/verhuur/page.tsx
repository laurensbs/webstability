import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { VerhuurDemo } from "@/components/marketing/demos/VerhuurDemo";

export const metadata: Metadata = {
  title: "Demo · Verhuurplatform | Webstability",
  description:
    "Geanonimiseerde demo van een verhuurplatform met live boekingen, betalingen en bezetting.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <VerhuurDemo />;
}
