import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { ApproachCard } from "@/components/marketing/ApproachCard";

export async function Approach() {
  const t = await getTranslations("home.approach");
  const keys = ["one", "two", "three", "four"] as const;

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

        <div className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting rail behind the cards on lg+ */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-12 right-8 left-8 hidden h-px bg-gradient-to-r from-transparent via-(--color-border) to-transparent lg:block"
          />
          {keys.map((key, i) => (
            <ApproachCard
              key={key}
              index={i}
              kicker={t(`items.${key}.kicker`)}
              title={t(`items.${key}.title`)}
              body={t(`items.${key}.body`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
