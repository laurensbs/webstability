import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { SmartPopup } from "@/components/marketing/SmartPopup";

/**
 * Server-component die de scroll-depth-popup op alle marketing-pages
 * mount. Eén keer per dag, opent op 40% scroll-diepte met een korte
 * "zin om te sparren?"-kaart + Cal-trigger.
 *
 * De exit-intent-popup op /prijzen is apart (alleen daar relevant) —
 * zie de prijzen-page zelf.
 */
export async function MarketingScrollPopup({ locale }: { locale: string }) {
  const t = await getTranslations("popups.scrollSpar");
  return (
    <SmartPopup
      id="scroll_spar"
      trigger="scroll"
      threshold={0.4}
      cooldownDays={1}
      eyebrow={t("eyebrow")}
      title={t("title")}
      body={t("body")}
    >
      <CalPopupTrigger
        locale={locale}
        className={buttonVariants({ variant: "accent", size: "sm" })}
      >
        {t("cta")}
      </CalPopupTrigger>
    </SmartPopup>
  );
}

/**
 * Exit-intent-popup specifiek voor /prijzen — laat bezoekers niet
 * weglopen zonder de optie om een vraag te stellen. Cooldown 7 dagen,
 * niet op mobile (geen exit-intent mogelijk).
 */
export async function PricingExitPopup({ locale }: { locale: string }) {
  const t = await getTranslations("popups.pricingExit");
  return (
    <SmartPopup
      id="pricing_exit"
      trigger="exit"
      cooldownDays={7}
      eyebrow={t("eyebrow")}
      title={t("title")}
      body={t("body")}
    >
      <CalPopupTrigger
        locale={locale}
        className={buttonVariants({ variant: "accent", size: "sm" })}
      >
        {t("cta")}
      </CalPopupTrigger>
    </SmartPopup>
  );
}
