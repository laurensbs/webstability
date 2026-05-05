import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { HeroVisual } from "@/components/marketing/HeroVisual";

export async function Hero() {
  const t = await getTranslations("home");
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-32 md:pt-32 md:pb-40">
      {/* Soft accent blob — purely decorative, behind everything. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-(--color-accent-soft) opacity-60 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl space-y-10">
        <div className="space-y-8">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
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
        <HeroVisual
          yearsLabel={t("hero.years")}
          sinceLabel={t("hero.since")}
          liveLabel={t("hero.live")}
        />
      </div>
    </section>
  );
}
