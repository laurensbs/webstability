import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { NewLeadForm } from "@/components/admin/NewLeadForm";

export default async function NewLeadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href={{ pathname: "/admin/leads" as never }}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
          Terug naar leads
        </Link>
        <h1 className="mt-4 font-serif text-[clamp(28px,4vw,38px)] leading-tight">Nieuwe lead</h1>
        <p className="mt-2 max-w-prose text-[14px] text-(--color-muted)">
          Handmatige entry — voor de Cal-booking en demo-self-serve loopt straks de webhook.
        </p>
      </div>

      <NewLeadForm />
    </div>
  );
}
