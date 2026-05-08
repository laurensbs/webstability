import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MarkupText } from "@/components/animate/MarkupText";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

/**
 * "Studio establishment shot" — donkere sectie op de homepage tussen
 * HowItWorks en Services. Zelfde sfeer als het /login-panel: cream
 * tekst op `--color-text` met conic-mesh + halo-blobs eronder.
 *
 * Niet "wat we doen" (dat zegt /diensten), wel "wie we zijn" — één
 * ontwikkelaar, MKB in NL+ES, doorlopend abonnement.
 */
export async function StudioStatement() {
  const t = await getTranslations("home.studioStatement");
  const tRaw = await getTranslations();
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
      {/* Statische halo-blobs — terracotta linksboven, teal rechtsonder */}
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-50 blur-3xl"
      />

      {/* Conic-mesh — langzaam roterend ambient */}
      <LoginAmbientMount className="pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="relative mx-auto max-w-[960px] px-6 py-24 md:py-32">
        <RevealOnScroll>
          <p className="font-mono text-[11px] tracking-widest text-(--color-bg)/55 uppercase">
            {"// "}
            {t("eyebrow")}
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

        {/* Stat-strip — flat, border-top zoals hero */}
        <RevealOnScroll delay={0.3}>
          <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-(--color-bg)/15 pt-9 sm:grid-cols-4">
            <Stat label={stats.yearsLabel} value={stats.yearsValue} />
            <Stat label={stats.productsLabel} value={stats.productsValue} />
            <Stat label={stats.uptimeLabel} value={stats.uptimeValue} />
            <Stat label={stats.regionLabel} value={stats.regionValue} />
          </div>
        </RevealOnScroll>

        {/* CTA-rij */}
        <RevealOnScroll delay={0.4}>
          <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-[34px] leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 font-mono text-[11px] tracking-widest text-(--color-bg)/55 uppercase">
        {label}
      </div>
    </div>
  );
}
