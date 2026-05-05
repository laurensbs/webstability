import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Button } from "@/components/ui/Button";

type CareItem = { id: "basic" | "pro" | "partner"; name: string; price: string; body: string };

export async function PricingTeaser() {
  const t = await getTranslations("home.pricing");
  const tCare = await getTranslations("pricing.care");
  const tRaw = await getTranslations();
  const items = tRaw.raw("pricing.care.items") as CareItem[];
  const reassurance = tRaw.raw("home.pricing.reassurance") as string[];

  return (
    <section className="border-t border-(--color-border) px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-5xl">{t.rich("title", { em: (c) => <em>{c}</em> })}</h2>
          <p className="text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => {
            const featured = item.id === "pro";
            return (
              <RevealOnScroll key={item.id} delay={i * 0.08}>
                <article
                  className={`relative flex h-full flex-col rounded-lg border p-8 transition-shadow duration-300 ${
                    featured
                      ? "border-(--color-accent) bg-(--color-surface) shadow-[0_12px_32px_-16px_rgba(201,97,79,0.35)]"
                      : "border-(--color-border) bg-(--color-surface) hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]"
                  }`}
                >
                  {featured ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-(--color-accent) px-3 py-1 font-mono text-[10px] tracking-widest text-white uppercase">
                      {t("featured")}
                    </span>
                  ) : null}
                  <h3 className="text-xl">{item.name}</h3>
                  <p className="mt-4 font-serif text-4xl text-(--color-text)">{item.price}</p>
                  <p className="mt-4 text-sm leading-relaxed text-(--color-muted)">{item.body}</p>
                  <div className="mt-auto pt-8">
                    <Button
                      asChild
                      variant={featured ? "accent" : "outline"}
                      size="md"
                      className="w-full"
                    >
                      <Link href="/contact">{tCare("talk")}</Link>
                    </Button>
                  </div>
                </article>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-(--color-border) py-5">
          {reassurance.map((r) => (
            <span key={r} className="inline-flex items-center gap-2 text-sm text-(--color-muted)">
              <Check className="h-3.5 w-3.5 text-(--color-success)" strokeWidth={2.5} />
              {r}
            </span>
          ))}
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 text-center">
          <Link
            href="/prijzen"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-(--color-accent) hover:underline"
          >
            {t("viewAll")}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
