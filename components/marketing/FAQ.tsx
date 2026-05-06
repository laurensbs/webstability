import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";

export async function FAQ() {
  const t = await getTranslations("home.faq");
  const tRaw = await getTranslations();
  const items = tRaw.raw("home.faq.items") as Array<{ q: string; a: string }>;

  return (
    <section className="px-6 py-[100px]">
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
