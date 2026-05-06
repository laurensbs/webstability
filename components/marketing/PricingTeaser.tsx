import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import {
  PricingCardsWithToggle,
  type PricingItem,
} from "@/components/marketing/PricingCardsWithToggle";

export async function PricingTeaser() {
  const t = await getTranslations("home.pricing");
  const tCare = await getTranslations("pricing.care");
  const tRaw = await getTranslations();
  const items = tRaw.raw("pricing.care.items") as PricingItem[];
  const reassurance = tRaw.raw("home.pricing.reassurance") as string[];

  return (
    <section id="prijzen" className="bg-(--color-bg-warm) px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-14 max-w-[720px] text-center">
          <Eyebrow className="mb-[18px]">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mx-auto mb-[18px] text-[clamp(32px,4.5vw,52px)]">
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("lede")}</p>
          </RevealOnScroll>
        </div>

        <PricingCardsWithToggle
          items={items}
          strings={{
            featuredLabel: t("featured"),
            monthlyLabel: tCare("billingMonthly"),
            annualLabel: tCare("billingAnnual"),
            annualHint: tCare("billingAnnualHint"),
            perMonth: tCare("perMonth"),
            perMonthBilledAnnually: tCare("perMonthBilledAnnually"),
            ctaLabel: tCare("talk"),
          }}
        />

        <RevealOnScroll className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {reassurance.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-2 text-[14px] text-(--color-muted)"
            >
              <Check className="h-4 w-4 text-(--color-success)" strokeWidth={2} />
              {r}
            </span>
          ))}
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 text-center">
          <Link
            href="/prijzen"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-(--color-accent) hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
