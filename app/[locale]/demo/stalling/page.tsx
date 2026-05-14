import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { StallingDemo } from "@/components/marketing/demos/StallingDemo";

export const metadata: Metadata = {
  title: "Demo · Stallingsplatform | Webstability",
  description:
    "Geanonimiseerde demo van een caravanstalling-systeem met klantportaal, plekken-overzicht en facturatie.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <StallingDemo />;
}
