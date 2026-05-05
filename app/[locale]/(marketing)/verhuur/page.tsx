import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Calendar, FileText, CreditCard, X, Zap, Clock } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

type MetaItem = { num: string; label: string };
type ProblemItem = { title: string; body: string };
type SolutionItem = { title: string; body: string; bullets?: string[] };
type Plan = {
  id: string;
  name: string;
  desc: string;
  price: string;
  period: string;
  items: string[];
  cta: string;
};

const PROBLEM_ICONS = [X, Zap, Clock];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("verhuur.v2");
  const tRaw = await getTranslations();
  const metaItems = tRaw.raw("verhuur.v2.metaItems") as MetaItem[];
  const problems = tRaw.raw("verhuur.v2.problems") as ProblemItem[];
  const solutions = tRaw.raw("verhuur.v2.solutions") as SolutionItem[];
  const plans = tRaw.raw("verhuur.v2.plans") as Plan[];

  return (
    <main className="flex flex-1 flex-col">
      {/* HERO */}
      <header className="relative overflow-hidden px-6 pt-20 pb-[100px]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-70 blur-[40px]"
          style={{
            background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px]">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-[13px] text-(--color-muted) shadow-[0_1px_2px_rgba(31,27,22,0.04),0_1px_3px_rgba(31,27,22,0.06)]"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-(--color-success)"
              style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
            />
            {t("eyebrow")}
          </Link>

          <h1 className="mt-7 max-w-[14ch] text-[clamp(44px,7vw,84px)] leading-[1.05]">
            {t.rich("title", { em: (c) => <em>{c}</em> })}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[19px] leading-[1.55] text-(--color-muted)">
            {t("lede")}
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Button asChild size="lg" variant="primary" className="group">
              <a href="#solution">
                {t("ctaPrimary")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#contact">{t("ctaSecondary")} →</a>
            </Button>
          </div>

          {/* Meta-row */}
          <div className="mt-[72px] flex flex-wrap gap-x-10 gap-y-6 border-t border-(--color-border) pt-9">
            {metaItems.map((m) => (
              <div key={m.label}>
                <div className="font-serif text-[34px] leading-none">{m.num}</div>
                <div className="mt-1.5 text-[13px] text-(--color-muted)">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="bg-(--color-bg-warm) px-6 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <p className="mb-[18px] font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
              {"// "}
              {t("problemEyebrow")}
            </p>
            <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
              {t.rich("problemTitle", { em: (c) => <em>{c}</em> })}
            </h2>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("problemLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {problems.map((p, i) => {
              const Icon = PROBLEM_ICONS[i] ?? X;
              return (
                <RevealOnScroll key={p.title} delay={i * 0.08}>
                  <article className="h-full rounded-[20px] border border-(--color-border) bg-(--color-surface) p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]">
                    <div className="mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-red-100 text-red-600">
                      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </div>
                    <h3 className="mb-3 text-[24px] leading-[1.1]">{p.title}</h3>
                    <p className="text-[15px] leading-[1.6] text-(--color-muted)">{p.body}</p>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="px-6 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <p className="mb-[18px] font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
              {"// "}
              {t("solutionEyebrow")}
            </p>
            <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">
              {t.rich("solutionTitle", { em: (c) => <em>{c}</em> })}
            </h2>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("solutionLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
            {solutions.map((s, i) => {
              const Icon = i === 0 ? Calendar : i === 1 ? FileText : CreditCard;
              const large = i === 0;
              return (
                <RevealOnScroll key={s.title} delay={i * 0.08}>
                  <article
                    className={`group relative flex h-full flex-col rounded-[20px] border border-(--color-border) bg-(--color-surface) transition-all duration-300 hover:border-(--color-border-strong,#D8CDB6) hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)] ${
                      large ? "p-11 md:row-span-2" : "p-9"
                    }`}
                  >
                    <div className="mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-(--color-accent-soft) text-(--color-accent) transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:bg-(--color-accent) group-hover:text-white">
                      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </div>
                    <h3
                      className={
                        large ? "mb-3 text-[32px] leading-[1.1]" : "mb-3 text-[24px] leading-[1.1]"
                      }
                    >
                      {s.title}
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-(--color-muted)">{s.body}</p>
                    {s.bullets ? (
                      <ul className="mt-[22px] space-y-0 border-t border-(--color-border) pt-[22px]">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2.5 py-[5px] text-[14px] text-(--color-muted)"
                          >
                            <span
                              className="h-1 w-1 shrink-0 rounded-full bg-(--color-accent)"
                              aria-hidden
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED TESTIMONIAL */}
      <section className="bg-(--color-text) px-6 py-[80px] text-(--color-bg)">
        <RevealOnScroll className="mx-auto max-w-[760px] text-center">
          <div className="mb-6 font-serif text-[80px] leading-[0.5] text-(--color-accent) opacity-60">
            “
          </div>
          <blockquote className="mb-8 font-serif text-[clamp(24px,3vw,32px)] leading-[1.3] font-light text-(--color-bg)">
            {t("quoteText")}
          </blockquote>
          <div className="flex items-center justify-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-(--color-accent) text-[15px] font-semibold text-white">
              {t("quoteInitials")}
            </div>
            <div className="text-left">
              <div className="font-medium">{t("quoteName")}</div>
              <div className="text-[13px] text-(--color-bg)/65">{t("quoteRole")}</div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* PRICING */}
      <section className="px-6 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <RevealOnScroll className="mb-14 max-w-[720px]">
            <p className="mb-[18px] font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
              {"// "}
              {t("pricingEyebrow")}
            </p>
            <h2 className="mb-[18px] text-[clamp(32px,4.5vw,52px)]">{t("pricingTitle")}</h2>
            <p className="max-w-[56ch] text-[18px] text-(--color-muted)">{t("pricingLede")}</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => {
              const featured = plan.id === "pro";
              return (
                <RevealOnScroll key={plan.id} delay={i * 0.08}>
                  <article
                    className={`relative flex h-full flex-col rounded-[28px] p-10 transition-all duration-300 ${
                      featured
                        ? "scale-[1.02] border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.3)]"
                        : "border border-(--color-border) bg-(--color-surface) hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
                    }`}
                  >
                    {featured ? (
                      <span className="absolute -top-2.5 right-6 rounded-full bg-(--color-accent) px-3 py-1 text-[11px] font-medium text-white">
                        Meest gekozen
                      </span>
                    ) : null}
                    <h3 className={`mb-1.5 text-[24px] ${featured ? "text-(--color-bg)" : ""}`}>
                      {plan.name}
                    </h3>
                    <p
                      className={`mb-7 text-[14px] ${
                        featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                      }`}
                    >
                      {plan.desc}
                    </p>
                    <div
                      className={`font-serif text-[48px] leading-none ${
                        featured ? "text-(--color-bg)" : ""
                      }`}
                    >
                      {plan.price}
                    </div>
                    <span
                      className={`mt-1 mb-7 block text-[13px] ${
                        featured ? "text-(--color-bg)/60" : "text-(--color-muted)"
                      }`}
                    >
                      {plan.period}
                    </span>
                    <ul className="mb-8 flex-grow space-y-2">
                      {plan.items.map((item) => (
                        <li
                          key={item}
                          className={`flex items-start gap-2.5 text-[14px] ${
                            featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                          }`}
                        >
                          <Check
                            className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                              featured ? "text-(--color-accent-soft)" : "text-(--color-accent)"
                            }`}
                            strokeWidth={2.5}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={featured ? "ghost" : "outline"}
                      className={`w-full justify-center ${
                        featured
                          ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                          : ""
                      }`}
                    >
                      <a href="#contact">{plan.cta}</a>
                    </Button>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-(--color-bg-warm) px-6 py-[120px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[80px]"
          style={{
            background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px]">
          <RevealOnScroll className="mx-auto max-w-3xl space-y-6 text-center">
            <p className="font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase">
              {"// "}
              {t("ctaEyebrow")}
            </p>
            <h2 className="text-[clamp(36px,5vw,60px)]">{t("ctaTitle")}</h2>
            <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{t("ctaBody")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Button asChild size="lg" variant="primary" className="group">
                <a href="mailto:hello@webstability.eu?subject=Verhuursysteem%20%E2%80%94%20kennismaking">
                  hello@webstability.eu
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">{t("ctaButton")} →</Link>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
