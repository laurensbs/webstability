import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

export async function CTABlock() {
  const t = await getTranslations("home.cta");
  return (
    <section className="relative overflow-hidden px-6 py-32">
      {/* Ambient terracotta blob, fixed-decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl"
      />
      <RevealOnScroll className="relative mx-auto max-w-3xl space-y-6 text-center">
        <h2 className="text-3xl md:text-5xl">{t.rich("title", { em: (c) => <em>{c}</em> })}</h2>
        <p className="text-(--color-muted) md:text-lg">{t("body")}</p>
        <div className="pt-2">
          <Button asChild size="lg" variant="accent" className="group">
            <Link href="/contact">
              <span>{t("button")}</span>
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Button>
        </div>
      </RevealOnScroll>
    </section>
  );
}
