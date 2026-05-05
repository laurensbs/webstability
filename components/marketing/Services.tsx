import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";

export async function Services() {
  const t = await getTranslations("home.services");
  const tRaw = await getTranslations();
  const adminBullets = tRaw.raw("home.services.items.admin.bullets") as string[];

  return (
    <section id="diensten" className="px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 max-w-[720px]">
          <Eyebrow className="mb-[18px]">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("lede")}</p>
          </RevealOnScroll>
        </div>

        {/* Asymmetric: large card spans 2 rows on md+, small cards stack */}
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
          <ServiceCard
            index={0}
            iconKey="admin"
            title={t("items.admin.title")}
            body={t("items.admin.body")}
            bullets={adminBullets}
            ctaHref="/verhuur"
            ctaLabel={t("items.admin.cta")}
            large
          />
          <ServiceCard
            index={1}
            iconKey="websites"
            title={t("items.websites.title")}
            body={t("items.websites.body")}
          />
          <ServiceCard
            index={2}
            iconKey="webshops"
            title={t("items.webshops.title")}
            body={t("items.webshops.body")}
          />
        </div>
      </div>
    </section>
  );
}
