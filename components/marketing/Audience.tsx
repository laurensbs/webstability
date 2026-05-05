import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function Audience() {
  const t = await getTranslations("home.audience");
  return (
    <section className="px-6 py-24">
      <RevealOnScroll className="mx-auto max-w-4xl space-y-6">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="text-3xl leading-tight md:text-5xl">
          {t.rich("title", { em: (c) => <em>{c}</em> })}
        </h2>
        <p className="text-lg text-(--color-muted)">{t("body")}</p>
      </RevealOnScroll>
    </section>
  );
}
