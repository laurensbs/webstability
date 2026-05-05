import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
    <section id="prijzen" className="bg-(--color-bg-warm) px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll className="mx-auto mb-14 max-w-[720px] text-center">
          <p className="mb-[18px] font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
            {"// "}
            {t("eyebrow")}
          </p>
          <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
            {t.rich("title", { em: (c) => <em>{c}</em> })}
          </h2>
          <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        <div className="grid gap-5 md:grid-cols-3">
          {items.map((item, i) => {
            const featured = item.id === "pro";
            return (
              <RevealOnScroll key={item.id} delay={i * 0.08}>
                <article
                  className={`relative flex h-full flex-col rounded-[28px] p-10 transition-all duration-300 ${
                    featured
                      ? "scale-[1.02] border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.3)]"
                      : "border border-(--color-border) bg-(--color-surface) hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
                  }`}
                >
                  {featured ? (
                    <span className="absolute -top-2.5 right-6 rounded-full bg-(--color-accent) px-3 py-1 text-[11px] font-medium text-white">
                      {t("featured")}
                    </span>
                  ) : null}
                  <h3 className={`mb-1.5 text-[24px] ${featured ? "text-(--color-bg)" : ""}`}>
                    {item.name}
                  </h3>
                  <p
                    className={`mb-7 text-[14px] ${
                      featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                    }`}
                  >
                    {item.body}
                  </p>
                  <div
                    className={`font-serif text-[48px] leading-none ${
                      featured ? "text-(--color-bg)" : ""
                    }`}
                  >
                    {item.price}
                  </div>
                  <span
                    className={`mt-1 mb-7 block text-[13px] ${
                      featured ? "text-(--color-bg)/60" : "text-(--color-muted)"
                    }`}
                  >
                    per maand · excl. btw
                  </span>
                  <ul className="mb-8 flex-grow space-y-2">
                    <li
                      className={`flex items-start gap-2.5 text-[14px] ${
                        featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                      }`}
                    >
                      <Check
                        className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                          featured ? "text-(--color-accent-soft)" : "text-(--color-accent)"
                        }`}
                        strokeWidth={2.5}
                      />
                      {item.body}
                    </li>
                  </ul>
                  <Button
                    asChild
                    variant={featured ? "ghost" : "outline"}
                    className={`w-full justify-center ${
                      featured
                        ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                        : ""
                    }`}
                  >
                    <Link href="/contact">{tCare("talk")}</Link>
                  </Button>
                </article>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {reassurance.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-2 text-[14px] text-(--color-muted)"
            >
              <Check className="h-4 w-4 text-(--color-success)" strokeWidth={2} />
              {r}
            </span>
          ))}
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 text-center">
          <Link
            href="/prijzen"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-(--color-accent) hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
