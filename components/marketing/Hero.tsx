import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { HeroMeta } from "@/components/marketing/HeroMeta";
import { SystemDiagram } from "@/components/marketing/SystemDiagram";

export async function Hero() {
  const t = await getTranslations("home");
  const tHero = await getTranslations("home.hero");
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Soft accent blob, decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-(--color-accent-soft) opacity-60 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-6">
            {/* Availability pill — scarcity signal. */}
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 font-mono text-xs tracking-wide text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text)"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent) opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
              </span>
              {tHero("availability")}
              <span className="text-(--color-accent) transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </Link>

            <h1 className="text-5xl leading-[1.05] md:text-7xl">
              {t.rich("headline", { em: (c) => <em>{c}</em> })}
            </h1>
            <p className="max-w-2xl text-lg text-(--color-muted) md:text-xl">{t("tagline")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/contact">{t("ctaPrimary")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/prijzen">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>

          {/* Illustration — abstract system diagram. Hidden on small screens
              to keep the headline doing the heavy lifting on mobile. */}
          <SystemDiagram className="mx-auto hidden aspect-square w-full max-w-md lg:block" />
        </div>

        <div className="mt-12 lg:mt-16">
          <HeroMeta
            yearsLabel={tHero("metaYearsLabel")}
            uptimeLabel={tHero("metaUptimeLabel")}
            regionLabel={tHero("metaRegionLabel")}
            regionValue={tHero("metaRegionValue")}
            liveLabel={tHero("live")}
          />
        </div>
      </div>
    </section>
  );
}
