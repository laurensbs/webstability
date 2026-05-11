import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { ProjectConfigurator } from "@/components/marketing/ProjectConfigurator";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, breadcrumbLd, siteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "aanvragen");
}

export default async function AanvragenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("configurator");
  const path = locale === "es" ? "/es/solicitar" : "/aanvragen";
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? null;
  const calUrl = calLink ? `https://cal.com/${calLink}?ctx=configurator` : null;

  // Vlakke records uit messages → strings-prop voor de client-component.
  const palettes: Record<string, string> = {
    warm: t("palettes.warm"),
    modern: t("palettes.modern"),
    dark: t("palettes.dark"),
    fresh: t("palettes.fresh"),
    bold: t("palettes.bold"),
  };
  const languages: Record<string, string> = {
    nl: t("languages.nl"),
    nl_es: t("languages.nl_es"),
    nl_es_en: t("languages.nl_es_en"),
  };
  const options: Record<string, string> = {
    multilingual: t("options.multilingual"),
    inventorySync: t("options.inventorySync"),
    blog: t("options.blog"),
    customDesign: t("options.customDesign"),
    copywriting: t("options.copywriting"),
    bookingForm: t("options.bookingForm"),
  };

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
          <ProjectConfigurator
            calLink={calUrl}
            strings={{
              eyebrow: t("eyebrow"),
              title: t("title"),
              lede: t("lede"),
              stepLabel: t("stepLabel"),
              back: t("back"),
              next: t("next"),
              submit: t("submit"),
              submitting: t("submitting"),
              kindTitle: t("steps.kind.title"),
              kindLede: t("steps.kind.lede"),
              kindWebsite: t("steps.kind.website"),
              kindWebsiteBody: t("steps.kind.websiteBody"),
              kindWebshop: t("steps.kind.webshop"),
              kindWebshopBody: t("steps.kind.webshopBody"),
              scopeTitle: t("steps.scope.title"),
              scopeLede: t("steps.scope.lede"),
              scopePagesLabel: t("steps.scope.pagesLabel"),
              scopeIncluded: t("steps.scope.included"),
              scopePerExtra: t("steps.scope.perExtra"),
              lookTitle: t("steps.look.title"),
              lookLede: t("steps.look.lede"),
              lookCustomLabel: t("steps.look.customLabel"),
              lookCustomPlaceholder: t("steps.look.customPlaceholder"),
              languageTitle: t("steps.language.title"),
              languageLede: t("steps.language.lede"),
              optionsTitle: t("steps.options.title"),
              optionsLede: t("steps.options.lede"),
              optionsNote: t("steps.options.note"),
              detailsTitle: t("steps.details.title"),
              detailsLede: t("steps.details.lede"),
              nameLabel: t("steps.details.name"),
              emailLabel: t("steps.details.email"),
              companyLabel: t("steps.details.company"),
              messageLabel: t("steps.details.message"),
              messagePlaceholder: t("steps.details.messagePlaceholder"),
              summaryTitle: t("summary.title"),
              estimateLabel: t("summary.estimateLabel"),
              estimateNote: t("summary.estimateNote"),
              summaryToggle: t("summary.toggle"),
              successTitle: t("success.title"),
              successBody: t("success.body"),
              successCta: t("success.cta"),
              successDone: t("success.done"),
              palettes,
              languages,
              options,
              lineBaseWebsite: t("lines.baseWebsite"),
              lineBaseWebshop: t("lines.baseWebshop"),
              lineExtraPages: t("lines.extraPages"),
            }}
          />
        </div>
      </section>
    </main>
  );
}
