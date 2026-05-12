import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { MarkupText } from "@/components/animate/MarkupText";

/**
 * Homepage diensten-sectie. Restructured rond 4 concrete oplossingen
 * (in plaats van 3 abstracte tiers): twee productlijnen met vanaf-prijs
 * voor de bouw, twee doorlopende abonnementen met maandprijs. Onder de
 * grid een korte uitleg over hoe bouwen + onderhouden in één abonnement
 * zit zodat de klant direct snapt waarom er twee soorten prijzen zijn.
 */

type SolutionItem = {
  key: "verhuurplatform" | "platform" | "webshop" | "care";
  ctaHref: string;
};

// Verhuurplatform staat eerst — het is de wig (NL+ES verhuur is het
// primaire segment). Website/webshop linkt naar de configurator zodat de
// bezoeker meteen een richtprijs ziet. Care komt als laatste tile met de
// "doorlopend abonnement"-framing; Studio-instap zit op /prijzen.
const SOLUTIONS: SolutionItem[] = [
  { key: "verhuurplatform", ctaHref: "/verhuur" },
  { key: "platform", ctaHref: "/diensten" },
  { key: "webshop", ctaHref: "/aanvragen" },
  { key: "care", ctaHref: "/prijzen" },
];

export async function Services() {
  const t = await getTranslations("home.services");

  return (
    <section id="diensten" className="py-section px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 max-w-[760px]">
          <Eyebrow className="mb-[18px]">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="max-w-[60ch] text-[18px] text-(--color-muted)">{t("lede")}</p>
          </RevealOnScroll>
        </div>

        {/* 2×2 grid — gelijke cards in plaats van asymmetrisch */}
        <div className="grid gap-5 md:grid-cols-2">
          {SOLUTIONS.map((s, i) => (
            <ServiceCard
              key={s.key}
              index={i}
              iconKey={s.key}
              title={t(`items.${s.key}.title`)}
              body={t(`items.${s.key}.body`)}
              pricePill={t(`items.${s.key}.pricePill`)}
              ctaHref={s.ctaHref}
              ctaLabel={t(`items.${s.key}.cta`)}
            />
          ))}
        </div>

        {/* Uitleg-strook onder grid — verbindt build-prijs met maandprijs.
            Cream-card met wijn-rode top-2px hairline om te claimen dat
            dit een "earned"-insight is naast de donkere service-cards. */}
        <RevealOnScroll className="shadow-card mx-auto mt-12 max-w-3xl rounded-[20px] border border-t-2 border-(--color-border) border-t-(--color-wine)/60 bg-(--color-surface) p-7">
          <p className="text-[15px] leading-[1.65] text-(--color-text)">
            <MarkupText>{t("bridgeNote")}</MarkupText>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
