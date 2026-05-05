import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AudienceVisual } from "@/components/marketing/AudienceVisual";
import { MarkupText } from "@/components/animate/MarkupText";

export async function Audience() {
  const t = await getTranslations("home.audience");
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr] md:items-center">
        <RevealOnScroll className="space-y-6">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl leading-tight md:text-5xl">
            {<MarkupText>{t("title")}</MarkupText>}
          </h2>
          <p className="text-lg text-(--color-muted)">{t("body")}</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.15}>
          <AudienceVisual nlLabel={t("nlLabel")} esLabel={t("esLabel")} tzLabel={t("tzLabel")} />
        </RevealOnScroll>
      </div>
    </section>
  );
}
