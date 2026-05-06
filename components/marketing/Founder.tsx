import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { FounderFormMount } from "@/components/r3f/FounderFormMount";

export async function Founder() {
  const t = await getTranslations("home.founder");
  return (
    <section className="bg-(--color-bg-warm) px-6 py-[120px]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-20 md:grid-cols-[1fr_1.2fr]">
        {/* Photo block — gradient bg with giant "L" + dark badge */}
        <RevealOnScroll>
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-teal-soft, #DCE8E7) 100%)",
            }}
          >
            {/* Subtle 3D form behind the giant "L" — adds depth without
                fighting the typography for attention. */}
            <FounderFormMount className="pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply" />
            <div
              className="relative grid h-full place-items-center font-serif text-[200px] leading-none font-light"
              style={{ color: "rgba(31,27,22,0.08)" }}
            >
              L
            </div>
            <div
              className="absolute right-6 bottom-6 left-6 flex items-center gap-2.5 rounded-[14px] px-4 py-3.5 text-[13px] text-(--color-bg) backdrop-blur-md"
              style={{ background: "rgba(31, 27, 22, 0.85)" }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-(--color-success)"
                style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.25)" }}
              />
              {t("liveBadge")}
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <Eyebrow className="mb-[18px]">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h2" className="mb-6 text-[clamp(32px,4vw,48px)]">
            {t("title")}
          </AnimatedHeading>
          <p className="mb-[18px] font-serif text-[19px] leading-[1.5] text-(--color-text)">
            {t("body")}
          </p>
          <p className="mb-4 text-[16px] leading-[1.65] text-(--color-muted)">{t("body2")}</p>
          <p className="text-[16px] leading-[1.65] text-(--color-muted)">{t("body3")}</p>

          <div className="mt-7 flex items-center gap-4 border-t border-(--color-border) pt-7">
            <div>
              <div className="font-serif text-[22px] italic">{t("name")}</div>
              <div className="text-[13px] text-(--color-muted)">{t("role")}</div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/over"
              className="inline-flex items-center gap-1 text-[14px] font-medium text-(--color-accent) hover:underline"
            >
              {t("cta")} →
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
