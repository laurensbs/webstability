import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function Approach() {
  const t = await getTranslations("home.approach");
  const keys = ["one", "two", "three"] as const;

  return (
    <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="max-w-2xl space-y-4">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-5xl">{t("title")}</h2>
        </RevealOnScroll>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {keys.map((key, i) => (
            <RevealOnScroll key={key} delay={i * 0.08} className="space-y-3">
              <p className="font-mono text-xs tracking-widest text-(--color-accent)">
                {t(`items.${key}.kicker`)}
              </p>
              <h3 className="text-xl">{t(`items.${key}.title`)}</h3>
              <p className="text-sm leading-relaxed text-(--color-muted)">
                {t(`items.${key}.body`)}
              </p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
