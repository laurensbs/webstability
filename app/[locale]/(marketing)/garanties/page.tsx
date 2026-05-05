import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { EyeOff, Database, UserCheck, Unlock, Shield, type LucideIcon } from "lucide-react";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { MarkupText } from "@/components/animate/MarkupText";

const ICONS: LucideIcon[] = [EyeOff, Database, UserCheck, Unlock];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("guarantees");
  const tRaw = await getTranslations();
  const promises = tRaw.raw("guarantees.promises") as Array<{ title: string; body: string }>;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={<MarkupText>{t("title")}</MarkupText>}
        lede={t("lede")}
      />

      {/* NDA card */}
      <section className="px-6 pb-16">
        <RevealOnScroll className="mx-auto max-w-4xl">
          <article className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-(--color-accent-soft) opacity-50 blur-3xl"
            />
            <div className="relative flex items-start gap-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent)">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl">{t("ndaTitle")}</h2>
                <p className="mt-3 leading-relaxed text-(--color-muted)">{t("ndaBody")}</p>
              </div>
            </div>
          </article>
        </RevealOnScroll>
      </section>

      {/* Promises grid */}
      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="max-w-2xl space-y-3">
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              {"// "}beloftes
            </p>
            <h2 className="text-3xl md:text-4xl">{t("promisesTitle")}</h2>
          </RevealOnScroll>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {promises.map((p, i) => {
              const Icon = ICONS[i] ?? Shield;
              return (
                <RevealOnScroll key={p.title} delay={i * 0.06}>
                  <article className="group relative h-full overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-7 transition-shadow duration-300 hover:shadow-[0_12px_32px_-16px_rgba(31,27,22,0.16)]">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-(--color-accent-soft) opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                    />
                    <div className="relative">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent) transition-colors duration-300 group-hover:border-(--color-accent) group-hover:bg-(--color-accent-soft)">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-xl">{p.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{p.body}</p>
                    </div>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
