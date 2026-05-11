import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { ProjectConfigurator } from "@/components/marketing/ProjectConfigurator";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, breadcrumbLd, siteUrl } from "@/lib/seo";
import { buildConfiguratorStrings } from "@/lib/configurator-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "aanvragen");
}

export default async function AanvragenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("configurator");
  const path = locale === "es" ? "/es/solicitar" : "/aanvragen";
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? null;
  const calUrl = calLink ? `https://cal.com/${calLink}?ctx=configurator` : null;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <JsonLd
        data={breadcrumbLd([
          {
            name: locale === "es" ? "Inicio" : "Home",
            url: siteUrl(locale === "es" ? "/es" : "/"),
          },
          { name: t("eyebrow"), url: siteUrl(path) },
        ])}
      />

      <header className="relative overflow-hidden px-6 pt-20 pb-10 md:pt-28 md:pb-12">
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -right-32 hidden h-[420px] w-[420px] rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl md:block"
        />
        <div className="mx-auto max-w-5xl">
          <Eyebrow className="inline-block">{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 max-w-[20ch] font-serif text-[clamp(32px,5vw,56px)] leading-[1.05]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-prose text-[16px] leading-[1.6] text-(--color-muted)">
            {t("lede")}
          </p>
        </div>
      </header>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <ProjectConfigurator calLink={calUrl} strings={buildConfiguratorStrings(t)} />
        </div>
      </section>
    </main>
  );
}
