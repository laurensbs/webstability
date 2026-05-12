import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/Button";
import { MagneticButton } from "@/components/animate/MagneticButton";
import { MarkupText } from "@/components/animate/MarkupText";
import { MountReveal } from "@/components/animate/MountReveal";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { StudioParallaxHalos } from "@/components/marketing/StudioParallaxHalos";
import { DemoChooserModal } from "@/components/marketing/DemoChooserModal";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { HeroMockup } from "@/components/marketing/HeroMockup";
import { HeroMockupParallax } from "@/components/marketing/HeroMockupParallax";
import { HeroMockupCompact } from "@/components/marketing/HeroMockupCompact";

/**
 * Donkere cinematische hero — één serif moneyshot, één primary CTA,
 * mockup-card als drijvend bewijsstuk. Zelfde studio-stem als de rest
 * van de site (StudioStatement, footer-zone-1, NavMegaMenu, login).
 *
 * Animatie-budget (max 2 tegelijk):
 *  1. Conic-mesh + halos (ambient)
 *  2. Booking-in + revenue-tick op de mockup (eenmalig bij mount)
 */
export async function Hero() {
  const t = await getTranslations("home");
  const tHero = await getTranslations("home.hero");
  const locale = await getLocale();

  return (
    <section className="relative isolate overflow-hidden bg-(--color-text) px-6 pt-20 pb-20 text-(--color-bg) md:pt-28 md:pb-32">
      {/* Ambient layers — halos + conic-mesh. Op mobile (< md) vervangen
          door één statische gradient zodat iPhone niet 32s-rotaties +
          pointermove-springs hoeft te draaien. Premium-gevoel blijft
          via depth in de gradient zelf. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 md:hidden"
        style={{
          background:
            "radial-gradient(80% 60% at 20% 10%, rgba(201,97,79,0.18) 0%, transparent 60%), radial-gradient(60% 50% at 90% 90%, rgba(107,30,44,0.22) 0%, transparent 60%)",
        }}
      />
      <div className="hidden md:contents">
        <StudioParallaxHalos />
        <LoginAmbientMount className="pointer-events-none absolute inset-0 -z-10 opacity-50" />
      </div>

      {/* Bottom-fade naar cream voor zachte overgang naar LogoStrip */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-(--color-bg)"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* Links — moneyshot + sub + CTA + tertiaire links */}
          <div>
            <MountReveal delay={0}>
              <h1 className="max-w-[18ch] font-serif text-[clamp(40px,6vw,76px)] leading-[1.05] tracking-[-0.02em] text-(--color-bg)">
                <MarkupText>{tHero("title")}</MarkupText>
              </h1>
            </MountReveal>

            <MountReveal delay={0.12}>
              <p className="mt-6 max-w-[54ch] text-[17px] leading-[1.6] text-(--color-bg)/70">
                {tHero("lede")}
              </p>
            </MountReveal>

            <MountReveal delay={0.24}>
              <div className="mt-9">
                <MagneticButton>
                  <CalPopupTrigger
                    locale={locale}
                    className={`${buttonVariants({ variant: "accent", size: "lg" })} group w-full sm:w-auto`}
                  >
                    {t("ctaPrimary")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </CalPopupTrigger>
                </MagneticButton>
              </div>
            </MountReveal>

            {/* Tertiaire link-rij — cases · demo · login */}
            <MountReveal delay={0.34}>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-(--color-bg)/65">
                <Link
                  href="/cases"
                  className="rounded underline decoration-(--color-bg)/25 underline-offset-4 transition-colors hover:text-(--color-bg) hover:decoration-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                >
                  {t("ctaSecondary")} →
                </Link>
                <span aria-hidden className="text-(--color-bg)/25">
                  ·
                </span>
                <DemoChooserModal
                  strings={{
                    triggerLabel: tHero("tryDemo"),
                    title: tHero("demoModalTitle"),
                    body: tHero("demoModalBody"),
                    portalLabel: tHero("demoPortalLabel"),
                    portalBody: tHero("demoPortalBody"),
                    adminLabel: tHero("demoAdminLabel"),
                    adminBody: tHero("demoAdminBody"),
                    cancel: tHero("demoCancel"),
                  }}
                />
                <span aria-hidden className="text-(--color-bg)/25">
                  ·
                </span>
                <Link
                  href="/login"
                  className="rounded underline decoration-(--color-bg)/25 underline-offset-4 transition-colors hover:text-(--color-bg) hover:decoration-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                >
                  {tHero("loginCta")} →
                </Link>
              </p>
            </MountReveal>

            {/* Compacte mockup — alleen op mobile + tablet (< lg) */}
            <div className="mt-12 lg:hidden">
              <HeroMockupCompact />
            </div>
          </div>

          {/* Rechts — admin-mockup, alleen vanaf lg. HeroMockup heeft
              eigen entry-animatie + booking-in scripted in AdminView; de
              parallax-wrapper laat de kaart subtiel meedrijven op scroll. */}
          <div className="hidden lg:block">
            <HeroMockupParallax>
              <HeroMockup />
            </HeroMockupParallax>
          </div>
        </div>
      </div>
    </section>
  );
}
