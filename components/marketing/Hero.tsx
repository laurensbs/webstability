import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/Button";
import { RotatingPill } from "@/components/animate/RotatingPill";
import { MagneticButton } from "@/components/animate/MagneticButton";
import { RotatingWords } from "@/components/animate/RotatingWords";
import { DemoChooserModal } from "@/components/marketing/DemoChooserModal";
import { HeroProposition } from "@/components/marketing/HeroProposition";
import { HeroMockup } from "@/components/marketing/HeroMockup";
import { HeroMockupCompact } from "@/components/marketing/HeroMockupCompact";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

export async function Hero() {
  const t = await getTranslations("home");
  const tHero = await getTranslations("home.hero");
  const tRaw = await getTranslations();
  const locale = await getLocale();
  const rotatingWords = tRaw.raw("home.hero.rotatingWords") as string[];
  const eyebrowMessages = tRaw.raw("home.hero.eyebrowMessages") as string[];
  const propositionLines = tRaw.raw("home.hero.proposition") as Array<{
    icon: "layers" | "zap" | "sparkles";
    text: string;
  }>;

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-24 md:pb-28">
      {/* Soft accent blob — top right, decorative */}
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-70 blur-[40px]"
        style={{
          background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div>
            {/* Availability pill — spring-scale entry, green dot ring */}
            <RotatingPill href="/contact" messages={eyebrowMessages} />

            <HeroProposition lines={propositionLines} />

            <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.55] text-(--color-muted)">
              {tHero("taglinePrefix")} <RotatingWords words={rotatingWords} />{" "}
              {tHero("taglineSuffix")}
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
              <MagneticButton>
                <CalPopupTrigger
                  locale={locale}
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} group w-full sm:w-auto`}
                >
                  {t("ctaPrimary")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </CalPopupTrigger>
              </MagneticButton>
              <MagneticButton>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/login">
                    {tHero("alreadyClient")} {tHero("loginCta")} →
                  </Link>
                </Button>
              </MagneticButton>
            </div>

            {/* Cases-link + demo-chooser tertiair onder de buttons */}
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-(--color-muted)">
              <Link
                href="/cases"
                className="underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-text) hover:decoration-(--color-accent)"
              >
                {t("ctaSecondary")} →
              </Link>
              <span aria-hidden className="text-(--color-border)">
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
            </p>
            {/* Compacte mockup — alleen op mobile + tablet (< lg) */}
            <div className="mt-10 lg:hidden">
              <HeroMockupCompact />
            </div>
          </div>

          {/* Rechter kolom — live admin-mockup, alleen vanaf lg */}
          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
