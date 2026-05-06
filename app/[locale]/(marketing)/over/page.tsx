import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { routing } from "@/i18n/routing";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { FounderFormMount } from "@/components/r3f/FounderFormMount";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const tRaw = await getTranslations();
  const principles = tRaw.raw("about.principles") as Array<{
    kicker: string;
    title: string;
    body: string;
  }>;
  const timeline = tRaw.raw("about.timeline") as Array<{ year: string; body: string }>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      {/* HERO with portrait + intro side-by-side */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.4fr] md:items-center">
          <RevealOnScroll>
            {/* Portrait box — same gradient + giant L treatment as the
                homepage Founder block. TODO: swap for a real
                /public/laurens.jpg when one is ready. */}
            <div
              className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[28px] shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-teal-soft, #DCE8E7) 100%)",
              }}
            >
              <FounderFormMount className="pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply" />
              <div
                className="relative grid h-full place-items-center font-serif text-[200px] leading-none font-light"
                style={{ color: "rgba(31,27,22,0.08)" }}
              >
                L
              </div>
              <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-bg)/85 px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-muted) backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
                </span>
                <MapPin className="h-3 w-3" />
                Begur · Costa Brava
              </span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="space-y-5">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {t("eyebrow")}
            </p>
            <AnimatedHeading as="h1" className="text-4xl leading-[1.05] md:text-6xl">
              {t("title")}
            </AnimatedHeading>
            <p className="text-lg leading-relaxed text-(--color-muted) md:text-xl">{t("intro")}</p>
          </RevealOnScroll>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl space-y-3">
            <Eyebrow>principes</Eyebrow>
            <AnimatedHeading as="h2" className="text-3xl md:text-5xl">
              {t("principlesTitle")}
            </AnimatedHeading>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {principles.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 0.06}>
                <article className="group h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-7 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]">
                  <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {p.kicker}
                  </p>
                  <h3 className="mt-3 text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-3">
            <Eyebrow>tijdlijn</Eyebrow>
            <AnimatedHeading as="h2" className="text-3xl md:text-5xl">
              {t("timelineTitle")}
            </AnimatedHeading>
          </div>
          <ol className="relative mt-14 space-y-10 border-l-2 border-(--color-border) pl-10">
            {timeline.map((item, i) => (
              <RevealOnScroll key={`${item.year}-${i}`} delay={i * 0.05}>
                <li className="relative">
                  <span className="absolute top-2 -left-[47px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-(--color-accent) bg-(--color-bg)">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
                  </span>
                  <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {item.year}
                  </p>
                  <p className="mt-2 leading-relaxed">{item.body}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-3xl md:text-5xl">{t("ctaTitle")}</h2>
          <p className="text-(--color-muted)">{t("ctaBody")}</p>
          <div className="pt-2">
            <Button asChild size="lg" variant="accent">
              <Link href="/contact">{t("ctaButton")}</Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
