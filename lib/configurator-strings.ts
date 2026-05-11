// Bouwt het `strings`-object voor <ProjectConfigurator> uit een
// next-intl `getTranslations("configurator")`-resultaat. Eén plek zodat
// zowel /aanvragen als de website/webshop-vertical-embed dezelfde labels
// gebruiken zonder de ~70-regels-mapping te dupliceren.

type T = (key: string) => string;

export type ConfiguratorStrings = {
  eyebrow: string;
  title: string;
  lede: string;
  stepLabel: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  kindTitle: string;
  kindLede: string;
  kindWebsite: string;
  kindWebsiteBody: string;
  kindWebshop: string;
  kindWebshopBody: string;
  scopeTitle: string;
  scopeLede: string;
  scopePagesLabel: string;
  scopeIncluded: string;
  scopePerExtra: string;
  lookTitle: string;
  lookLede: string;
  lookCustomLabel: string;
  lookCustomPlaceholder: string;
  languageTitle: string;
  languageLede: string;
  optionsTitle: string;
  optionsLede: string;
  optionsNote: string;
  detailsTitle: string;
  detailsLede: string;
  nameLabel: string;
  emailLabel: string;
  companyLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  summaryTitle: string;
  estimateLabel: string;
  estimateNote: string;
  summaryToggle: string;
  successTitle: string;
  successBody: string;
  successCta: string;
  successDone: string;
  palettes: Record<string, string>;
  languages: Record<string, string>;
  options: Record<string, string>;
  lineBaseWebsite: string;
  lineBaseWebshop: string;
  lineExtraPages: string;
};

export function buildConfiguratorStrings(t: T): ConfiguratorStrings {
  return {
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
    palettes: {
      warm: t("palettes.warm"),
      modern: t("palettes.modern"),
      dark: t("palettes.dark"),
      fresh: t("palettes.fresh"),
      bold: t("palettes.bold"),
    },
    languages: {
      nl: t("languages.nl"),
      nl_es: t("languages.nl_es"),
      nl_es_en: t("languages.nl_es_en"),
    },
    options: {
      multilingual: t("options.multilingual"),
      inventorySync: t("options.inventorySync"),
      blog: t("options.blog"),
      customDesign: t("options.customDesign"),
      copywriting: t("options.copywriting"),
      bookingForm: t("options.bookingForm"),
    },
    lineBaseWebsite: t("lines.baseWebsite"),
    lineBaseWebshop: t("lines.baseWebshop"),
    lineExtraPages: t("lines.extraPages"),
  };
}
