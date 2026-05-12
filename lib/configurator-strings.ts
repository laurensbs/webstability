// Bouwt het `strings`-object voor <ProjectConfigurator> uit een
// next-intl `getTranslations("configurator")`-resultaat. Eén plek zodat
// zowel /aanvragen als de website/webshop-vertical-embed dezelfde labels
// gebruiken zonder de ~70-regels-mapping te dupliceren.

// Een next-intl-translator: `t(key)` voor gewone strings, `t.raw(key)` voor
// strings die nog onvervulde {placeholders} bevatten (de component vult die
// client-side in via .replace — als we ze door t() halen ziet next-intl ze als
// ICU-argumenten en geeft bij ontbreken de key terug).
type T = ((key: string) => string) & { raw: (key: string) => unknown };

const rawStr = (t: T, key: string) => String(t.raw(key));

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
  kindTooComplexLead: string;
  kindTooComplexLink: string;
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
  successNextTitle: string;
  successNextWebsite: string[];
  successNextWebshop: string[];
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
    stepLabel: rawStr(t, "stepLabel"),
    back: t("back"),
    next: t("next"),
    submit: t("submit"),
    submitting: t("submitting"),
    kindTitle: t("steps.kind.title"),
    kindLede: t("steps.kind.lede"),
    kindTooComplexLead: t("steps.kind.tooComplexLead"),
    kindTooComplexLink: t("steps.kind.tooComplexLink"),
    kindWebsite: t("steps.kind.website"),
    kindWebsiteBody: t("steps.kind.websiteBody"),
    kindWebshop: t("steps.kind.webshop"),
    kindWebshopBody: t("steps.kind.webshopBody"),
    scopeTitle: t("steps.scope.title"),
    scopeLede: t("steps.scope.lede"),
    scopePagesLabel: t("steps.scope.pagesLabel"),
    scopeIncluded: rawStr(t, "steps.scope.included"),
    scopePerExtra: rawStr(t, "steps.scope.perExtra"),
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
    successBody: rawStr(t, "success.body"),
    successCta: t("success.cta"),
    successDone: t("success.done"),
    successNextTitle: t("success.nextTitle"),
    successNextWebsite: t.raw("success.nextWebsite") as string[],
    successNextWebshop: t.raw("success.nextWebshop") as string[],
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
    lineBaseWebsite: rawStr(t, "lines.baseWebsite"),
    lineBaseWebshop: rawStr(t, "lines.baseWebshop"),
    lineExtraPages: rawStr(t, "lines.extraPages"),
  };
}
