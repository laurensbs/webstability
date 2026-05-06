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
  key: "platform" | "webshop" | "care" | "growth";
  pricePill: string;
  ctaHref: string;
};

const SOLUTIONS: SolutionItem[] = [
  { key: "platform", pricePill: "vanaf €7.800 · 6 mnd build", ctaHref: "/diensten#platform" },
  { key: "webshop", pricePill: "vanaf €3.000 · 3 mnd build", ctaHref: "/diensten#webshop" },
  { key: "care", pricePill: "€69/m · doorlopend", ctaHref: "/prijzen" },
  { key: "growth", pricePill: "€179/m · doorlopend", ctaHref: "/prijzen" },
];

export async function Services() {
  const t = await getTranslations("home.services");

  return (
    <section id="diensten" className="px-6 py-[100px]">
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
              pricePill={s.pricePill}
              ctaHref={s.ctaHref}
              ctaLabel={t(`items.${s.key}.cta`)}
            />
          ))}
        </div>

        {/* Uitleg-strook onder grid — verbindt build-prijs met maandprijs */}
        <RevealOnScroll className="mx-auto mt-12 max-w-3xl rounded-[20px] border border-(--color-border) bg-(--color-bg-warm) p-7">
          <p className="text-[15px] leading-[1.65] text-(--color-text)">
            <MarkupText>{t("bridgeNote")}</MarkupText>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
