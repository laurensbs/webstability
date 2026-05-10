import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Verschijnt op /portal/seo voor klanten op Care. Strategie: SEO is
 * onderdeel van Studio (€179/m); voor Care-klanten een eerlijke
 * upsell-card die zegt wat ze missen + waarom.
 */
export function SeoUpsell({
  strings,
}: {
  strings: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    cta: string;
  };
}) {
  return (
    <article className="relative overflow-hidden rounded-[18px] border border-(--color-border) bg-(--color-text) p-8 text-(--color-bg) md:p-10">
      <span
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-32 -right-24 h-[280px] w-[280px] rounded-full bg-(--color-wine) opacity-40 blur-3xl"
      />

      <div className="relative">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
          <Sparkles className="h-3 w-3" strokeWidth={2.2} />
          {strings.eyebrow}
        </p>
        <h2 className="mt-4 font-serif text-[28px] leading-tight md:text-[36px]">
          {strings.title}
        </h2>
        <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.65] text-(--color-bg)/70">
          {strings.body}
        </p>

        <ul className="mt-6 space-y-2">
          {strings.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[14px] text-(--color-bg)/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--color-accent)" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/prijzen"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] transition-colors hover:bg-(--color-accent)/90"
        >
          {strings.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
