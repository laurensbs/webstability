import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function Founder() {
  const t = await getTranslations("home.founder");
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1fr_1.4fr]">
        <RevealOnScroll>
          <div className="aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg border border-(--color-border) bg-(--color-bg-warm)">
            {/* Founder portrait placeholder — vervang met /public/laurens.jpg in Phase 5 */}
            <div className="flex h-full items-center justify-center font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              laurens · begur
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="space-y-6">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl leading-tight md:text-5xl">
            {t.rich("title", { em: (c) => <em>{c}</em> })}
          </h2>
          <p className="text-lg text-(--color-muted)">{t("body")}</p>
          <Link
            href="/over"
            className="inline-block font-mono text-sm text-(--color-accent) hover:underline"
          >
            {t("cta")} →
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
