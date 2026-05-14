import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";

const FOUNDER_PHOTO = "https://u.cubeupload.com/laurensbos/IMG1806.jpeg";

export async function Founder() {
  const t = await getTranslations("home.founder");
  return (
    <section className="py-section bg-(--color-bg-warm) px-6">
      <div className="mx-auto grid max-w-[1200px] items-center gap-20 md:grid-cols-[1fr_1.2fr]">
        {/* Photo block — echte portretfoto met dark live-badge onderaan. */}
        <RevealOnScroll>
          <div className="shadow-floating rounded-modal relative aspect-[4/5] overflow-hidden">
            <Image
              src={FOUNDER_PHOTO}
              alt={t("name")}
              fill
              sizes="(min-width: 768px) 540px, 100vw"
              className="object-cover"
              priority={false}
            />
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
