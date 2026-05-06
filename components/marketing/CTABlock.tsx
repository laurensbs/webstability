import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { MagneticButton } from "@/components/animate/MagneticButton";

export async function CTABlock() {
  const t = await getTranslations("home.cta");
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-[120px]">
      {/* Ambient terracotta blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[80px]"
        style={{
          background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Eyebrow className="text-center">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mx-auto text-[clamp(36px,5vw,60px)]">
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("body")}</p>
          </RevealOnScroll>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <MagneticButton>
              <Button asChild size="lg" variant="primary" className="group">
                <a href="mailto:hello@webstability.eu">
                  hello@webstability.eu
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">{t("button")} →</Link>
              </Button>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
