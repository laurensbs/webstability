import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createOrgWithOwner } from "@/app/actions/admin";
import { OrgWizard } from "@/components/admin/OrgWizard";

export default async function NewOrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ name?: string; email?: string; projectType?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const sp = await searchParams;
  const prefill = {
    name: typeof sp.name === "string" ? sp.name : undefined,
    ownerName: typeof sp.name === "string" ? sp.name : undefined,
    ownerEmail: typeof sp.email === "string" ? sp.email : undefined,
  };

  const t = await getTranslations("admin.newOrg");
  const tWizard = await getTranslations("admin.wizard");

  return (
    <div className="space-y-8">
      <Link
        href="/admin/orgs"
        className="font-mono text-xs tracking-widest text-(--color-muted) uppercase hover:text-(--color-accent)"
      >
        ← {t("back")}
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="max-w-2xl text-(--color-muted)">{t("subtitle")}</p>
      </header>

      <div className="max-w-2xl">
        <OrgWizard
          action={createOrgWithOwner}
          prefill={prefill}
          strings={{
            step: tWizard("step"),
            step1Heading: tWizard("step1Heading"),
            step1Lede: tWizard("step1Lede"),
            nameLabel: tWizard("nameLabel"),
            namePlaceholder: tWizard("namePlaceholder"),
            countryLabel: tWizard("countryLabel"),
            vatLabel: tWizard("vatLabel"),
            vatPlaceholder: tWizard("vatPlaceholder"),
            step2Heading: tWizard("step2Heading"),
            step2Lede: tWizard("step2Lede"),
            ownerNameLabel: tWizard("ownerNameLabel"),
            ownerNamePlaceholder: tWizard("ownerNamePlaceholder"),
            ownerEmailLabel: tWizard("ownerEmailLabel"),
            ownerEmailPlaceholder: tWizard("ownerEmailPlaceholder"),
            step3Heading: tWizard("step3Heading"),
            step3Lede: tWizard("step3Lede"),
            planLabel: tWizard("planLabel"),
            planNone: tWizard("planNone"),
            planCare: tWizard("planCare"),
            planStudio: tWizard("planStudio"),
            planAtelier: tWizard("planAtelier"),
            back: tWizard("back"),
            next: tWizard("next"),
            submit: tWizard("submit"),
          }}
        />
      </div>
    </div>
  );
}
