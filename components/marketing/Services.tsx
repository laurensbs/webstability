import { getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { ServiceCard } from "@/components/marketing/ServiceCard";

export async function Services() {
  const t = await getTranslations("home.services");
  const tRaw = await getTranslations();
  const adminBullets = tRaw.raw("home.services.items.admin.bullets") as string[];

  return (
    <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="max-w-2xl space-y-4">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-5xl">{t("title")}</h2>
          <p className="text-(--color-muted)">{t("lede")}</p>
        </RevealOnScroll>

        {/* Asymmetric: large card spans 2 rows on md+, small cards stack. */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 md:grid-rows-2">
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
