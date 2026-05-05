import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export async function Hero() {
  const t = await getTranslations("home");
  const tHero = await getTranslations("home.hero");
  const startYear = 2016;
  const yearsExp = new Date().getFullYear() - startYear;

  // Inline meta items — simple "stat + label" row separated from the
  // hero copy by a top border, per the mockup.
  const metaItems = [
    { num: `${yearsExp}+`, label: tHero("metaYearsLabel") },
    { num: "99.98%", label: tHero("metaUptimeLabel") },
    { num: tHero("metaRegionValue"), label: tHero("metaRegionLabel") },
  ];

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-24 md:pb-28">
      {/* Soft accent blob — top right, decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-70 blur-[40px]"
        style={{
          background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        {/* Eyebrow pill — green dot + availability */}
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-[13px] text-(--color-muted) shadow-[0_1px_2px_rgba(31,27,22,0.04),0_1px_3px_rgba(31,27,22,0.06)] transition-colors hover:text-(--color-text)"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-(--color-success)"
            style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
          />
          {tHero("availability")}
        </Link>

        <h1 className="mt-7 max-w-[14ch] text-[clamp(44px,7vw,84px)] leading-[1.05]">
          {t.rich("headline", { em: (c) => <em>{c}</em> })}
        </h1>
        <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.55] text-(--color-muted)">
          {t("tagline")}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3.5">
          <Button asChild size="lg" variant="primary">
            <Link href="/contact">
              {t("ctaPrimary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/prijzen">{t("ctaSecondary")}</Link>
          </Button>
        </div>

        {/* Meta row — flat, border-top, no cards */}
        <div className="mt-[72px] flex flex-wrap gap-x-10 gap-y-6 border-t border-(--color-border) pt-9">
          {metaItems.map((m) => (
            <div key={m.label}>
              <div className="font-serif text-[34px] leading-none">{m.num}</div>
              <div className="mt-1.5 text-[13px] text-(--color-muted)">{m.label}</div>
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
