import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function CTABlock() {
  const t = await getTranslations("home.cta");
  return (
    <section className="px-6 py-24">
      <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
        <h2 className="text-3xl md:text-5xl">{t("title")}</h2>
        <p className="text-(--color-muted)">{t("body")}</p>
        <div className="pt-2">
          <Button asChild size="lg" variant="accent">
            <Link href="/contact">{t("button")}</Link>
          </Button>
        </div>
      </RevealOnScroll>
    </section>
  );
}
