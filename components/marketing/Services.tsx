import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function Services() {
  const t = await getTranslations("home.services");
  const keys = ["admin", "websites", "webshops"] as const;

  return (
    <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="max-w-2xl space-y-4">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-5xl">{t("title")}</h2>
          <p className="text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {keys.map((key, i) => (
            <RevealOnScroll key={key} delay={i * 0.08}>
              <article className="h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-8">
                <h3 className="text-2xl">{t(`items.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                  {t(`items.${key}.body`)}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
