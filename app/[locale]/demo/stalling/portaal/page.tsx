import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CustomerPortalDemo } from "@/components/marketing/demos/CustomerPortalDemo";

export const metadata: Metadata = {
  title: "Demo · Klantportaal stalling | Webstability",
  description:
    "Wat de eindklant van een caravanstalling in z'n portaal ziet — afspraken, facturen, documenten en updates.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <CustomerPortalDemo variant="stalling" />;
}
