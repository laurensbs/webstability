import { TrendingUp, Activity, FileBarChart, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Eerlijke "upgrade naar Studio"-nudge op het portal-dashboard voor Care-
 * klanten — laat zien wat ze missen (SEO-trend, uitgebreide monitoring,
 * maandrapport) i.p.v. die kaarten gewoon weg te laten. Donker brand-paneel,
 * past visueel bij de SeoUpsell-card op /portal/seo. Pure server-component.
 */
export function DashboardUpgradeNudge({
  strings,
}: {
  strings: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: { seo: string; monitoring: string; report: string };
    cta: string;
  };
}) {
  const items = [
    { icon: TrendingUp, label: strings.bullets.seo },
    { icon: Activity, label: strings.bullets.monitoring },
    { icon: FileBarChart, label: strings.bullets.report },
  ];
  return (
    <section className="rounded-panel relative overflow-hidden border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-text) p-6 text-(--color-bg) md:p-8">
      <span
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-28 -right-20 h-[260px] w-[260px] rounded-full bg-(--color-wine) opacity-30 blur-3xl"
      />
      <div className="relative">
        <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
          {"// "}
          {strings.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[22px] leading-tight md:text-[26px]">
          {strings.title}
        </h2>
        <p className="mt-2 max-w-prose text-[14px] leading-[1.6] text-(--color-bg)/70">
          {strings.body}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13px] text-(--color-bg)/85">
              <Icon
                className="h-3.5 w-3.5 shrink-0 text-(--color-accent)"
                strokeWidth={2}
                aria-hidden
              />
              {label}
            </li>
          ))}
        </ul>
        <Link
          href="/prijzen"
          className="group mt-5 inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 active:scale-[0.97] motion-reduce:active:scale-100"
        >
          {strings.cta}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
