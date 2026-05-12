import { ArrowRight } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { Button, buttonVariants } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { MagneticButton } from "@/components/animate/MagneticButton";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { Link } from "@/i18n/navigation";

export async function CTABlock() {
  const t = await getTranslations("home.cta");
  const locale = await getLocale();
  return (
    <section id="contact" className="py-section relative overflow-hidden px-6">
      {/* Ambient terracotta blob — op mobile flatten naar pure gradient
          zonder blur-filter (iPhone GPU-pijn). md+ behoudt blur-[80px]. */}
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute top-1/2 left-1/2 hidden h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[80px] md:block"
        style={{
          background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, var(--color-accent-soft) 0%, transparent 70%)",
          opacity: 0.35,
        }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Eyebrow className="text-center">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mx-auto text-[clamp(36px,5vw,60px)]">
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("body")}</p>
          </RevealOnScroll>
          {/* Pricing-hint — vervangt de losse PricingTeaser-sectie. Eén
              regel + link naar /prijzen voor wie het cijfer wil zien. */}
          <RevealOnScroll>
            <p className="mx-auto inline-flex max-w-[56ch] flex-wrap items-center justify-center gap-2 text-[14px] text-(--color-muted)">
              <span>{t("pricingHint")}</span>
              <Link
                href="/prijzen"
                className="font-medium text-(--color-accent) underline decoration-(--color-accent)/40 underline-offset-4 hover:decoration-(--color-accent)"
              >
                {t("pricingHintLink")} →
              </Link>
            </p>
          </RevealOnScroll>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <MagneticButton>
              <Button asChild size="lg" variant="primary" className="group">
                <a href="mailto:hello@webstability.eu">
                  hello@webstability.eu
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <CalPopupTrigger
                locale={locale}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {t("button")} →
              </CalPopupTrigger>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
