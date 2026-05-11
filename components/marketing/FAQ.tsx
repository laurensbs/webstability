import { getLocale, getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageLd } from "@/lib/seo";

/**
 * FAQ-sectie + FAQPage JSON-LD. De structured data komt mee waar deze
 * component ook gemount wordt (homepage, /faq). `messagesKey` bepaalt
 * uit welke i18n-namespace de items komen — default `home.faq`.
 */
export async function FAQ({ messagesKey = "home.faq" }: { messagesKey?: string } = {}) {
  const locale = await getLocale();
  const t = await getTranslations(messagesKey);
  const tRaw = await getTranslations();
  const items = tRaw.raw(`${messagesKey}.items`) as Array<{ q: string; a: string }>;

  return (
    <section className="px-6 py-[100px]">
      <JsonLd data={faqPageLd(items, locale)} />
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-14 max-w-[720px] text-center">
          <Eyebrow className="mb-[18px]">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mx-auto text-[clamp(32px,4.5vw,52px)]">
            {t("title")}
          </AnimatedHeading>
        </div>

        <Accordion type="single" collapsible className="mx-auto max-w-[760px]">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
