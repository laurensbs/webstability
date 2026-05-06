import { QuoteMarkDraw } from "@/components/animate/QuoteMarkDraw";

/**
 * Editorial pull-quote for blog posts. Sits as a block in the prose
 * stream and breaks rhythm visually — bigger Fraunces, terracotta
 * mark drawing itself in on scroll.
 *
 * Usage in MDX:
 *   <PullQuote attribution="Marco Jansen, Costa Caravans">
 *     Ik bespaar nu een halve dag per week.
 *   </PullQuote>
 */
export function PullQuote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <figure className="my-12 border-y border-(--color-border) py-10 text-center">
      <QuoteMarkDraw size={48} className="mx-auto mb-4" />
      <blockquote className="mx-auto max-w-[36ch] font-serif text-[clamp(22px,3vw,28px)] leading-[1.35] text-(--color-text) italic">
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className="mt-5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          — {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
