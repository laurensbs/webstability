import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function Approach() {
  const t = await getTranslations("home.approach");
  const keys = ["one", "two", "three", "four"] as const;

  return (
    <section className="px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll className="mb-14 max-w-[720px]">
          <p className="mb-[18px] font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
            {"// "}
            {t("eyebrow")}
          </p>
          <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">{t("title")}</h2>
          <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {keys.map((key, i) => (
            <RevealOnScroll key={key} delay={i * 0.08}>
              <div className="border-t-2 border-(--color-border) px-1 pt-7">
                <span className="mb-4 block font-serif text-[28px] text-(--color-accent) italic">
                  {t(`items.${key}.kicker`)}
                </span>
                <h4 className="mb-2.5 text-[19px]">{t(`items.${key}.title`)}</h4>
                <p className="text-[14px] leading-[1.55] text-(--color-muted)">
                  {t(`items.${key}.body`)}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
