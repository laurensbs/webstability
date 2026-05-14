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
import { PANEL_MONTHLY_PRICE } from "@/lib/verticals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "aanvragen");
}

const CUSTOM_KINDS: CustomServiceKind[] = ["verhuur", "klantportaal", "reparatie", "admin"];

// Mapping van picker-keys naar VERTICAL_SLUGS — voor de prijslabels
// in de cards. Eén plek aan te passen mocht slug-naming wijzigen.
const KIND_TO_SLUG: Record<CustomServiceKind, keyof typeof PANEL_MONTHLY_PRICE> = {
  verhuur: "verhuur-boekingssysteem",
  klantportaal: "klantportaal-laten-bouwen",
  reparatie: "reparatie-portaal",
  admin: "admin-systeem-op-maat",
};

function priceLabel(kind: CustomServiceKind, locale: string): string {
  const price = PANEL_MONTHLY_PRICE[KIND_TO_SLUG[kind]];
  return locale === "es" ? `desde €${price}/mes` : `vanaf €${price}/mnd`;
}

export default async function AanvragenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("aanvragen");
  const path = locale === "es" ? "/es/solicitar" : "/aanvragen";

  // ServicePicker strings — vier panelen met prijslabel.
  const pickerStrings: ServicePickerStrings = {
    eyebrow: t("eyebrow"),
    title: t("title"),
    lede: t("lede"),
    panelsEyebrow: t("picker.panelsEyebrow"),
    options: {
      verhuur: {
        label: t("picker.options.verhuur.label"),
        body: t("picker.options.verhuur.body"),
        price: priceLabel("verhuur", locale),
      },
      klantportaal: {
        label: t("picker.options.klantportaal.label"),
        body: t("picker.options.klantportaal.body"),
        price: priceLabel("klantportaal", locale),
      },
      reparatie: {
        label: t("picker.options.reparatie.label"),
        body: t("picker.options.reparatie.body"),
        price: priceLabel("reparatie", locale),
      },
      admin: {
        label: t("picker.options.admin.label"),
        body: t("picker.options.admin.body"),
        price: priceLabel("admin", locale),
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
            pickerStrings={pickerStrings}
            customStrings={customStrings}
          />
        </div>
      </section>
    </main>
  );
}
