import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { routing } from "@/i18n/routing";
import { CalEmbed } from "@/components/marketing/CalEmbed";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "contact");
}

type AfterStep = { kicker: string; title: string; body: string };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const tRaw = await getTranslations();
  const after = tRaw.raw("contact.after") as AfterStep[];

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-12 md:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-xs tracking-wide text-(--color-muted)">
            <MapPin className="h-3 w-3 text-(--color-accent)" />
            {t("regionBadge")}
          </span>
          <h1 className="max-w-3xl text-4xl leading-[1.05] md:text-6xl">
            {<MarkupText>{t("title")}</MarkupText>}
          </h1>
          <p className="max-w-2xl text-lg text-(--color-muted)">{t("lede")}</p>
        </div>
      </section>

      {/* Two-column: after-steps + cal embed */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          {/* After steps */}
          <RevealOnScroll className="space-y-6">
            <div>
              <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                {"// "}stappen
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl">{t("afterTitle")}</h2>
            </div>
            <ol className="space-y-5">
              {after.map((step) => (
                <li
                  key={step.kicker}
                  className="group relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5"
                >
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 bg-(--color-accent) transition-transform duration-500 ease-out group-hover:scale-y-100"
                  />
                  <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {step.kicker}
                  </p>
                  <h3 className="mt-2 text-base font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{step.body}</p>
                </li>
              ))}
            </ol>
          </RevealOnScroll>

          {/* Cal embed */}
          <RevealOnScroll delay={0.15}>
            <div className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
              <CalEmbed locale={locale} />
            </div>
            <p className="mt-4 text-center font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {t("calFallback")}
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
