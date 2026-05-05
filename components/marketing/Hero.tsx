import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export async function Hero() {
  const t = await getTranslations("home");
  return (
    <section className="px-6 pt-24 pb-32 md:pt-32 md:pb-40">
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-5xl leading-[1.05] md:text-7xl">
          {t.rich("headline", { em: (c) => <em>{c}</em> })}
        </h1>
        <p className="max-w-2xl text-lg text-(--color-muted) md:text-xl">{t("tagline")}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/contact">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/prijzen">{t("ctaSecondary")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
