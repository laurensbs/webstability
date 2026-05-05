import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { NotFoundIllustration } from "@/components/marketing/NotFoundIllustration";
import { MarkupText } from "@/components/animate/MarkupText";

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");
  return (
    <main className="dotted-bg flex flex-1 items-center px-6 py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl leading-[1.05] md:text-6xl">
            {<MarkupText>{t("title")}</MarkupText>}
          </h1>
          <p className="max-w-xl text-lg text-(--color-muted)">{t("lede")}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/">{t("homeCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">{t("contactCta")}</Link>
            </Button>
          </div>
        </div>
        <NotFoundIllustration symbol="?" className="mx-auto aspect-square w-full max-w-md" />
      </div>
    </main>
  );
}
