import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";
import { Button } from "@/components/ui/Button";
import { AnimatedCheck } from "@/components/marketing/AnimatedCheck";
import { SystemWireframe } from "@/components/marketing/SystemWireframe";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "diensten");
}

const SOLUTION_KEYS = ["platform", "webshop", "care", "growth"] as const;

/**
 * Per-productlijn frame-meta. Tot er echte product-screenshots zijn,
 * tonen we een donkere browser-frame placeholder met cream serif-italic
 * naam erin. URL is fictief maar herkenbaar; accent-tint geeft elke
 * sectie een eigen visuele toon.
 */
const FRAME_META: Record<
  (typeof SOLUTION_KEYS)[number],
  { url: string; titleNl: string; titleEs: string; accent: string }
> = {
  platform: {
    url: "admin.jouwbedrijf.nl",
    titleNl: "Bedrijfssoftware",
    titleEs: "Software a medida",
    accent: "rgba(201,97,79,0.5)",
  },
  webshop: {
    url: "jouwwinkel.nl/checkout",
    titleNl: "Webshop & site",
    titleEs: "Tienda y web",
    accent: "rgba(44,95,93,0.5)",
  },
  care: {
    url: "status.jouwbedrijf.nl",
    titleNl: "Onderhoud & monitoring",
    titleEs: "Mantenimiento",
    accent: "rgba(90,122,74,0.5)",
  },
  growth: {
    url: "dashboard.jouwbedrijf.nl/seo",
    titleNl: "Doorontwikkeling",
    titleEs: "Evolución",
    accent: "rgba(107,30,44,0.55)",
  },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("servicesPage");
  const tRaw = await getTranslations();

  return (
    <main className="flex flex-1 flex-col">
      {/* Donkere hero met systeem-wireframe rechts */}
      <section className="relative isolate overflow-hidden bg-(--color-text) text-(--color-bg)">
        {/* Halo-blobs */}
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-35 blur-3xl"
        />
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-40 blur-3xl"
        />
        {/* Conic-mesh ambient */}
        <LoginAmbientMount className="pointer-events-none absolute inset-0 -z-10 opacity-50" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-24 md:py-32 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
              {"// "}
              {t("eyebrow")}
            </p>
            <h1 className="max-w-[18ch] font-serif text-[clamp(36px,5.5vw,64px)] leading-[1.05]">
              <MarkupText>{t("title")}</MarkupText>
            </h1>
            <p className="max-w-[56ch] text-[17px] leading-[1.65] text-(--color-bg)/70">
              {t("lede")}
            </p>
          </div>

          {/* Wireframe rechts — alleen vanaf md zichtbaar, zodat het op
              mobile niet competeert met de copy */}
          <div className="hidden md:block">
            <SystemWireframe />
          </div>
        </div>
      </section>

      <div className="dotted-bg flex flex-1 flex-col">
        {SOLUTION_KEYS.map((key, i) => {
          const item = tRaw.raw(`servicesPage.items.${key}`) as {
            anchor: string;
            eyebrow: string;
            title: string;
            what: string;
            solvesTitle: string;
            solves: string[];
            includesTitle: string;
            includes: string[];
            packageTitle: string;
            packageBody: string;
            exampleTitle: string;
            exampleBody: string;
            ctaPrimary: string;
            ctaSecondary: string;
            ctaSecondaryHref: string;
          };
          const altRow = i % 2 === 1;
          // Sectie 1 + 3 krijgen een wijn-rode top-hairline — earned
          // wijn-rood zonder de "premium accent"-regel te breken.
          const wineDivider = i === 0 || i === 2;
          const frame = FRAME_META[key];
          const frameTitle = locale === "es" ? frame.titleEs : frame.titleNl;

          return (
            <section
              key={key}
              id={item.anchor}
              className={`scroll-mt-24 px-6 py-20 md:py-28 ${
                wineDivider ? "border-t-2 border-(--color-wine)/40" : ""
              } ${altRow ? "border-y border-(--color-border) bg-(--color-bg-warm)" : ""}`}
            >
              <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr]">
                {/* Left — frame + eyebrow + titel + wat het oplost */}
                <RevealOnScroll className="space-y-6">
                  {/* Donker product-frame placeholder — wordt vervangen door
                    echte screenshot zodra die er is */}
                  <ProductFrame url={frame.url} title={frameTitle} accentColor={frame.accent} />
                  <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                    {"// "}
                    {item.eyebrow}
                  </p>
                  <h2 className="text-3xl leading-[1.1] md:text-5xl">{item.title}</h2>
                  <p className="text-[17px] leading-[1.65] text-(--color-muted)">{item.what}</p>

                  <div className="space-y-3">
                    <h3 className="font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                      {item.solvesTitle}
                    </h3>
                    <ul className="space-y-2.5">
                      {item.solves.map((s, idx) => (
                        <li
                          key={s}
                          className="flex items-start gap-2.5 text-[15px] text-(--color-muted)"
                        >
                          <span className="mt-1 shrink-0">
                            <AnimatedCheck delay={idx * 0.08} />
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealOnScroll>

                {/* Right — wat erbij zit + pakket + voorbeeld + CTA */}
                <RevealOnScroll
                  delay={0.08}
                  className="group space-y-6 rounded-[24px] border border-(--color-border) bg-(--color-surface) p-8 shadow-[0_1px_2px_rgba(31,27,22,0.04),0_4px_12px_-4px_rgba(31,27,22,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-(--color-accent)/40 hover:shadow-[0_2px_4px_rgba(31,27,22,0.06),0_24px_48px_-12px_rgba(201,97,79,0.18)] md:p-10"
                >
                  <div>
                    <h3 className="mb-4 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                      {item.includesTitle}
                    </h3>
                    <ul className="space-y-2">
                      {item.includes.map((f, idx) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-[14px] text-(--color-muted)"
                        >
                          <span className="mt-1 shrink-0">
                            <AnimatedCheck delay={idx * 0.06} />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pakket-info met wijn-rode top-border — premium "earned" accent */}
                  <div className="rounded-[14px] border border-t-2 border-(--color-border) border-t-(--color-wine)/60 bg-(--color-bg-warm) p-5">
                    <h4 className="mb-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                      {item.packageTitle}
                    </h4>
                    <p className="text-[14px] leading-[1.6] text-(--color-muted)">
                      <MarkupText>{item.packageBody}</MarkupText>
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                      {item.exampleTitle}
                    </h4>
                    <p className="text-[14px] leading-[1.6] text-(--color-text)">
                      <MarkupText>{item.exampleBody}</MarkupText>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button asChild variant="primary">
                      <Link href="/contact">
                        {item.ctaPrimary}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <a
                      href={item.ctaSecondaryHref}
                      className="text-[14px] font-medium text-(--color-accent) hover:underline"
                    >
                      {item.ctaSecondary}
                    </a>
                  </div>
                </RevealOnScroll>
              </div>
            </section>
          );
        })}

        {/* Footer-CTA naar /cases */}
        <section className="border-t border-(--color-border) px-6 py-24">
          <RevealOnScroll className="mx-auto max-w-3xl space-y-5 text-center">
            <h2 className="text-2xl md:text-4xl">{t("footerCtaTitle")}</h2>
            <p className="text-(--color-muted)">{t("footerCtaBody")}</p>
            <div className="flex justify-center pt-2">
              <Button asChild variant="outline">
                <Link href="/cases">
                  {t("footerCtaLabel")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </RevealOnScroll>
        </section>
      </div>
    </main>
  );
}
