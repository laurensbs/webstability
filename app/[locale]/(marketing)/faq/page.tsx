import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { FAQ } from "@/components/marketing/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, breadcrumbLd, siteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "faq");
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("faqPage");
  const faqPath = locale === "es" ? "/es/preguntas" : "/faq";

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <JsonLd
        data={breadcrumbLd([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: siteUrl(locale === "es" ? "/es" : "/"),
          },
          { name: locale === "es" ? "Preguntas" : "FAQ", url: siteUrl(faqPath) },
        ])}
      />

      {/* HERO */}
      <header className="relative overflow-hidden px-6 pt-20 pb-12 md:pt-28 md:pb-16">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl md:block"
        />
        <RevealOnScroll className="relative mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow className="inline-block">{t("eyebrow")}</Eyebrow>
          <AnimatedHeading as="h1" className="text-4xl leading-[1.05] md:text-6xl">
            {t("title")}
          </AnimatedHeading>
          <p className="mx-auto max-w-[60ch] text-[17px] leading-[1.65] text-(--color-muted)">
            {t("lede")}
          </p>
        </RevealOnScroll>
      </header>

      {/* FAQ — hergebruikt het FAQ-component (rendert FAQPage-JSON-LD
          inline) met de faqPage-namespace. */}
      <FAQ messagesKey="faqPage" />

      {/* CTA */}
      <section className="py-section border-t border-(--color-border) bg-(--color-bg-warm) px-6">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-h2">
            {locale === "es" ? "¿No está tu pregunta?" : "Staat je vraag er niet bij?"}
          </h2>
          <p className="text-(--color-muted)">
            {locale === "es"
              ? "Escríbeme o reserva treinta minutos — respuesta honesta en un día, sin presentación comercial."
              : "Mail me of plan dertig minuten — binnen een dag een eerlijk antwoord, geen verkooppraat."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <CalPopupTrigger
              locale={locale}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              {locale === "es" ? "Reserva una llamada" : "Plan een gesprek"}
            </CalPopupTrigger>
            <Link
              href={{ pathname: "/diensten" }}
              className={`${buttonVariants({ variant: "ghost", size: "lg" })} gap-1`}
            >
              {locale === "es" ? "Ver servicios" : "Bekijk de diensten"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
