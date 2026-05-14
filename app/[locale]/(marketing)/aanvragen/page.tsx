import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { AanvragenWizard } from "@/components/marketing/AanvragenWizard";
import type { ServicePickerStrings } from "@/components/marketing/ServicePicker";
import type { CustomServiceIntakeStrings } from "@/components/marketing/CustomServiceIntake";
import type { CustomServiceKind } from "@/app/actions/custom-intake";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, breadcrumbLd, siteUrl } from "@/lib/seo";
import { buildConfiguratorStrings } from "@/lib/configurator-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "aanvragen");
}

const CUSTOM_KINDS: CustomServiceKind[] = ["verhuur", "klantportaal", "reparatie", "admin"];

export default async function AanvragenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Header-strings komen uit `aanvragen.*` (nieuwe blok); de configurator
  // wizard zelf gebruikt nog z'n eigen `configurator.*`-namespace.
  const t = await getTranslations("aanvragen");
  const tConfig = await getTranslations("configurator");
  const path = locale === "es" ? "/es/solicitar" : "/aanvragen";
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? null;
  const calUrl = calLink ? `https://cal.com/${calLink}?ctx=configurator` : null;

  // ServicePicker strings
  const pickerStrings: ServicePickerStrings = {
    eyebrow: t("eyebrow"),
    title: t("title"),
    lede: t("lede"),
    configFlowEyebrow: t("picker.configFlowEyebrow"),
    customFlowEyebrow: t("picker.customFlowEyebrow"),
    options: {
      website: {
        label: t("picker.options.website.label"),
        body: t("picker.options.website.body"),
      },
      webshop: {
        label: t("picker.options.webshop.label"),
        body: t("picker.options.webshop.body"),
      },
      verhuur: {
        label: t("picker.options.verhuur.label"),
        body: t("picker.options.verhuur.body"),
      },
      klantportaal: {
        label: t("picker.options.klantportaal.label"),
        body: t("picker.options.klantportaal.body"),
      },
      reparatie: {
        label: t("picker.options.reparatie.label"),
        body: t("picker.options.reparatie.body"),
      },
      admin: {
        label: t("picker.options.admin.label"),
        body: t("picker.options.admin.body"),
      },
    },
  };

  // CustomServiceIntake strings per kind — labels uit picker.options
  // worden hergebruikt zodat de header van de intake matcht met de keuze.
  const customStrings: Record<CustomServiceKind, CustomServiceIntakeStrings> = Object.fromEntries(
    CUSTOM_KINDS.map((kind) => [
      kind,
      {
        kindLabel: t(`picker.options.${kind}.label`),
        kindLede: t("custom.kindLede"),
        nameLabel: t("custom.form.name"),
        namePlaceholder: t("custom.form.namePlaceholder"),
        emailLabel: t("custom.form.email"),
        emailPlaceholder: t("custom.form.emailPlaceholder"),
        companyLabel: t("custom.form.company"),
        companyPlaceholder: t("custom.form.companyPlaceholder"),
        messageLabel: t("custom.form.message"),
        messagePlaceholder: t("custom.form.messagePlaceholder"),
        back: t("custom.back"),
        submit: t("custom.submit"),
        submitting: t("custom.submitting"),
        successTitle: t("custom.success.title"),
        successBody: t("custom.success.body"),
        successCta: t("custom.success.cta"),
        errorMissing: t("custom.errors.missing"),
        errorEmail: t("custom.errors.email"),
        errorRate: t("custom.errors.rate"),
        errorGeneric: t("custom.errors.generic"),
      } satisfies CustomServiceIntakeStrings,
    ]),
  ) as Record<CustomServiceKind, CustomServiceIntakeStrings>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <JsonLd
        data={breadcrumbLd([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: siteUrl(locale === "es" ? "/es" : "/"),
          },
          { name: t("eyebrow"), url: siteUrl(path) },
        ])}
      />

      <header className="relative overflow-hidden px-6 pt-20 pb-10 md:pt-28 md:pb-12">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl md:block"
        />
        <div className="mx-auto max-w-5xl">
          <Eyebrow className="inline-block">{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 max-w-[20ch] font-serif text-[clamp(32px,5vw,56px)] leading-[1.05]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-prose text-[16px] leading-[1.6] text-(--color-muted)">
            {t("lede")}
          </p>
        </div>
      </header>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <AanvragenWizard
            locale={locale}
            calLink={calUrl}
            configuratorStrings={buildConfiguratorStrings(tConfig)}
            pickerStrings={pickerStrings}
            customStrings={customStrings}
          />
        </div>
      </section>
    </main>
  );
}
