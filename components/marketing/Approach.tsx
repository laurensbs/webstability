import { getTranslations } from "next-intl/server";
import { ApproachRail } from "@/components/marketing/ApproachRail";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";

/**
 * Werkwijze-sectie: vier stappen op een progress-rail. Donkere studio-
 * stijl die aansluit bij StudioStatement / Hero / footer-zone-1. De
 * rail trekt zichzelf bij scroll-in, nodes pop'en in op tempo.
 */
export async function Approach() {
  const t = await getTranslations("home.approach");
  const tRaw = await getTranslations();
  type Step = { kicker: string; title: string; body: string; meta: string };
  const steps = (["one", "two", "three", "four"] as const).map(
    (k) => tRaw.raw(`home.approach.items.${k}`) as Step,
  );

  return (
    <section className="py-section relative isolate overflow-hidden bg-(--color-text) px-6 text-(--color-bg)">
      {/* Wijn-rode halo rechtsboven voor depth — geen volle conic-mesh,
          de rail moet de visuele dominant blijven. Halos alleen md+; op
          mobile één rustige gradient zonder blur-3xl. */}
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-wine) opacity-30 blur-3xl md:block"
      />
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -bottom-32 -left-24 hidden h-[320px] w-[320px] rounded-full bg-(--color-accent) opacity-25 blur-3xl md:block"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-16 max-w-[720px]">
          <Eyebrow className="mb-[18px] text-(--color-bg)/55">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading
            as="h2"
            className="mb-[18px] text-[clamp(32px,4.5vw,52px)] text-(--color-bg)"
          >
            {t("title")}
          </AnimatedHeading>
          <RevealOnScroll>
            <p className="max-w-[56ch] text-[18px] text-(--color-bg)/70">{t("lede")}</p>
          </RevealOnScroll>
        </div>

        <ApproachRail steps={steps} />
      </div>
    </section>
  );
}
