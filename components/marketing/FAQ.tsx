import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function FAQ() {
  const t = await getTranslations("home.faq");
  const tRaw = await getTranslations();
  const items = tRaw.raw("home.faq.items") as Array<{ q: string; a: string }>;

  return (
    <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll className="space-y-4">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-5xl">{t("title")}</h2>
        </RevealOnScroll>

        <Accordion
          type="single"
          collapsible
          className="mt-12 overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)"
        >
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="px-5">
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-xs tracking-widest text-(--color-muted)">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item.q}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pl-[3.25rem]">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
