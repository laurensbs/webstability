import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { Eyebrow } from "@/components/animate/Eyebrow";

/**
 * Testimonials — disabled by default. Drop into the homepage with
 * `<Testimonials />` once `home.testimonials.items` in messages/*.json
 * holds real customer quotes (NOT placeholders). Each item: { quote, name,
 * role, initials }. Render is suppressed if no items exist so the section
 * never ships empty.
 */

type Item = { quote: string; name: string; role: string; initials: string };

export async function Testimonials() {
  const t = await getTranslations("home.testimonials");
  const items = ((await getTranslations()).raw("home.testimonials.items") as Item[]) ?? [];

  if (!items.length) return null;

  return (
    <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="max-w-2xl space-y-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="text-3xl md:text-5xl">
            <MarkupText>{t("title")}</MarkupText>
          </h2>
          <p className="text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        {/* grid-cols-1 expliciet: zonder gedefinieerde kolom valt mobile terug
            op een impliciete auto-kolom die op max-content sized — daardoor liep
            de kaart breder dan de viewport (horizontale overflow). 1fr is wél aan
            de container geklemd, min-w-0 laat 'm krimpen. */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <RevealOnScroll key={item.name} delay={i * 0.08} className="min-w-0">
              <article className="flex h-full min-w-0 flex-col rounded-lg border border-(--color-border) bg-(--color-surface) p-7">
                <p className="font-serif text-4xl leading-none text-(--color-accent)">“</p>
                <blockquote className="mt-3 text-base leading-relaxed">{item.quote}</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-(--color-accent) to-(--color-teal) font-mono text-xs text-white">
                    {item.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate font-mono text-xs text-(--color-muted)">{item.role}</p>
                  </div>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
