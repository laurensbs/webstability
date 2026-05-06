import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { RotatingPill } from "@/components/animate/RotatingPill";
import { FlashCounter } from "@/components/animate/FlashCounter";
import { MagneticButton } from "@/components/animate/MagneticButton";
import { RotatingWords } from "@/components/animate/RotatingWords";

export async function Hero() {
  const t = await getTranslations("home");
  const tHero = await getTranslations("home.hero");
  const tRaw = await getTranslations();
  const rotatingWords = tRaw.raw("home.hero.rotatingWords") as string[];
  const eyebrowMessages = tRaw.raw("home.hero.eyebrowMessages") as string[];
  const startYear = 2016;
  const yearsExp = new Date().getFullYear() - startYear;

  // Stats with raw numerical values so FlashCounter can tween properly.
  // Region label (NL · ES) is a plain string, not animatable as a number.
  const stats: Array<
    | { value: number; suffix?: string; decimals?: number; label: string }
    | { plain: string; label: string }
  > = [
    { value: yearsExp, suffix: "+", label: tHero("metaYearsLabel") },
    { value: 2, label: tHero("metaPlatformsLabel") },
    { value: 99.98, suffix: "%", decimals: 2, label: tHero("metaUptimeLabel") },
    { plain: tHero("metaRegionValue"), label: tHero("metaRegionLabel") },
  ];

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
        {/* Availability pill — spring-scale entry, green dot ring */}
        <RotatingPill href="/contact" messages={eyebrowMessages} />

        <AnimatedHeading
          as="h1"
          className="mt-7 max-w-[14ch] text-[clamp(44px,7vw,84px)] leading-[1.05]"
        >
          {t("headline")}
        </AnimatedHeading>

        <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.55] text-(--color-muted)">
          {tHero("taglinePrefix")} <RotatingWords words={rotatingWords} /> {tHero("taglineSuffix")}
        </p>

        <div className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
          <MagneticButton>
            <Button asChild size="lg" variant="primary" className="group w-full sm:w-auto">
              <Link href="/contact">
                {t("ctaPrimary")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">
                {tHero("alreadyClient")} {tHero("loginCta")} →
              </Link>
            </Button>
          </MagneticButton>
        </div>

        {/* Cases-link tertiair onder de buttons */}
        <p className="mt-5 text-[14px] text-(--color-muted)">
          <Link
            href="/cases"
            className="underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-text) hover:decoration-(--color-accent)"
          >
            {t("ctaSecondary")} →
          </Link>
        </p>

        {/* Meta row — flat, border-top, no cards */}
        <div className="mt-[72px] flex flex-wrap gap-x-10 gap-y-6 border-t border-(--color-border) pt-9">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-serif text-[34px] leading-none">
                {"plain" in s ? (
                  s.plain
                ) : (
                  <FlashCounter to={s.value} suffix={s.suffix ?? ""} decimals={s.decimals ?? 0} />
                )}
              </div>
              <div className="mt-1.5 text-[13px] text-(--color-muted)">{s.label}</div>
            </div>
          ))}
          {/* Live status item — at the end, distinct */}
          <div className="ml-auto flex items-center gap-2.5 text-[13px]">
            <span
              className="h-2 w-2 rounded-full bg-(--color-success)"
              style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
            />
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {tHero("live")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
