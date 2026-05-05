import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { startCareCheckout } from "@/app/actions/billing";

type BuildItem = { name: string; price: string; body: string };
type CareItem = { id: "basic" | "pro" | "partner"; name: string; price: string; body: string };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pricing");
  const tRaw = await getTranslations();
  const buildItems = tRaw.raw("pricing.build.items") as BuildItem[];
  const careItems = tRaw.raw("pricing.care.items") as CareItem[];
  const addons = tRaw.raw("pricing.addons") as string[];

  const session = await auth();
  const user = session?.user?.id ? await getUserWithOrg(session.user.id) : null;
  const isOwner = user?.role === "owner";
  const currentPlan = user?.organization?.plan ?? null;

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t.rich("title", { em: (c) => <em>{c}</em> })}
        lede={t("lede")}
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="build" className="flex flex-col items-center">
            <TabsList>
              <TabsTrigger value="build">{t("tabBuild")}</TabsTrigger>
              <TabsTrigger value="care">{t("tabCare")}</TabsTrigger>
            </TabsList>

            <TabsContent value="build" className="mt-12 w-full">
              <p className="mx-auto max-w-2xl text-center text-(--color-muted)">
                {t("build.intro")}
              </p>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {buildItems.map((item, i) => (
                  <RevealOnScroll key={i} delay={i * 0.05}>
                    <article className="h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-8">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-2xl">{item.name}</h3>
                        <p className="font-mono text-sm text-(--color-accent)">{item.price}</p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                        {item.body}
                      </p>
                    </article>
                  </RevealOnScroll>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="care" className="mt-12 w-full">
              <p className="mx-auto max-w-2xl text-center text-(--color-muted)">
                {t("care.intro")}
              </p>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {careItems.map((item, i) => {
                  const isCurrent = currentPlan === item.id;
                  return (
                    <RevealOnScroll key={item.id} delay={i * 0.05}>
                      <article className="flex h-full flex-col rounded-lg border border-(--color-border) bg-(--color-surface) p-8">
                        <h3 className="text-xl">{item.name}</h3>
                        <p className="mt-2 font-mono text-sm text-(--color-accent)">{item.price}</p>
                        <p className="mt-4 flex-1 text-sm leading-relaxed text-(--color-muted)">
                          {item.body}
                        </p>
                        <div className="mt-6">
                          {isOwner ? (
                            isCurrent ? (
                              <span className="inline-block rounded-md border border-(--color-border) px-3 py-2 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                                {t("care.currentPlan")}
                              </span>
                            ) : (
                              <form action={startCareCheckout}>
                                <input type="hidden" name="plan" value={item.id} />
                                <Button type="submit" variant="accent" size="md">
                                  {t("care.subscribe")}
                                </Button>
                              </form>
                            )
                          ) : (
                            <Button asChild variant="outline" size="md">
                              <Link href="/contact">{t("care.talk")}</Link>
                            </Button>
                          )}
                        </div>
                      </article>
                    </RevealOnScroll>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-bg-warm) px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll>
            <h2 className="text-2xl md:text-3xl">{t("addonsTitle")}</h2>
          </RevealOnScroll>
          <ul className="mt-8 space-y-3">
            {addons.map((a, i) => (
              <RevealOnScroll key={i} delay={i * 0.04}>
                <li className="border-b border-(--color-border) pb-3 text-(--color-muted)">{a}</li>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-24">
        <RevealOnScroll className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl md:text-3xl">{t("philosophyTitle")}</h2>
          <p className="leading-relaxed text-(--color-muted)">{t("philosophyBody")}</p>
        </RevealOnScroll>
      </section>
    </main>
  );
}
