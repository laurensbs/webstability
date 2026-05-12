import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MarkupText } from "@/components/animate/MarkupText";
import { ScrambleText } from "@/components/animate/ScrambleText";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { StudioParallaxHalos } from "@/components/marketing/StudioParallaxHalos";
import { StudioStats } from "@/components/marketing/StudioStats";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

/**
 * "Studio establishment shot" — donkere sectie op de homepage tussen
 * HowItWorks en Services. Zelfde sfeer als het /login-panel: cream
 * tekst op `--color-text` met conic-mesh + halo-blobs eronder.
 *
 * Niet "wat we doen" (dat zegt /diensten), wel "wie we zijn" — één
 * ontwikkelaar, MKB in NL+ES, doorlopend abonnement.
 *
 * Animaties: ScrambleText op eyebrow, halo-blobs volgen cursor met
 * spring-lag, stat-strip krijgt FlashCounter count-up + stagger reveal
 * + stroke-draw divider — alles scroll-triggered, niets continu.
 */
export async function StudioStatement() {
  const t = await getTranslations("home.studioStatement");
  const tRaw = await getTranslations();
  const locale = await getLocale();
  const stats = tRaw.raw("home.studioStatement.stats") as {
    yearsLabel: string;
    yearsValue: string;
    productsLabel: string;
    productsValue: string;
    uptimeLabel: string;
    uptimeValue: string;
    regionLabel: string;
    regionValue: string;
  };

  return (
    <section className="relative isolate overflow-hidden bg-(--color-text) text-(--color-bg)">
      {/* Halo-blobs met subtle cursor-parallax */}
      <StudioParallaxHalos />

      {/* Conic-mesh — langzaam roterend ambient */}
      <LoginAmbientMount className="pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="py-section relative mx-auto max-w-[960px] px-6">
        <RevealOnScroll>
          <p className="font-mono text-[11px] tracking-widest text-(--color-bg)/55 uppercase">
            <ScrambleText text={`// ${t("eyebrow")}`} duration={900} />
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1}>
          <h2 className="mt-5 max-w-[20ch] font-serif text-[clamp(32px,5vw,56px)] leading-[1.1] text-(--color-bg)">
            <MarkupText>{t("title")}</MarkupText>
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.2}>
          <p className="mt-6 max-w-[58ch] text-[17px] leading-[1.65] text-(--color-bg)/70">
            {t("lede")}
          </p>
        </RevealOnScroll>

        {/* Stat-strip met FlashCounter + stagger + stroke-draw divider */}
        <StudioStats
          stats={[
            { value: 10, suffix: "+", label: stats.yearsLabel },
            { value: 3, label: stats.productsLabel },
            { value: 99.98, suffix: "%", decimals: 2, label: stats.uptimeLabel },
            { plain: stats.regionValue, label: stats.regionLabel },
          ]}
        />

        {/* CTA-rij */}
        <RevealOnScroll delay={0.4}>
          <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3">
            <CalPopupTrigger
              locale={locale}
              className="group inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </CalPopupTrigger>
            <Link
              href={t("ctaSecondaryHref") as never}
              className="rounded text-[14px] font-medium text-(--color-bg)/70 underline decoration-(--color-bg)/30 underline-offset-4 transition-colors hover:text-(--color-bg) hover:decoration-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent)"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
