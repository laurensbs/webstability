import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Gift, ArrowRight, Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/Button";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { getReferralByCode } from "@/lib/db/queries/referrals";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Publieke landing voor een referral-link /refer/[code]. De proxy heeft
 * de `ws_ref`-cookie al gezet; deze pagina toont alleen de boodschap +
 * CTA's. Onbekende code → notFound().
 *
 * Geen org-naam tonen als die niet ophaalbaar is (privacy/robuustheid);
 * dan een generieke variant.
 */
export default async function ReferPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const referral = await getReferralByCode(code);
  if (!referral) notFound();

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, referral.referrerOrgId),
    columns: { name: true },
  });
  const referrerName = org?.name ?? null;

  const t = await getTranslations("refer");
  const isEs = locale === "es";

  const headline = referrerName ? t("headlineNamed", { name: referrerName }) : t("headlineGeneric");

  const benefits = [t("benefit1"), t("benefit2"), t("benefit3")];

  return (
    <main className="dotted-bg py-section flex flex-1 items-center px-6">
      <RevealOnScroll className="mx-auto max-w-2xl">
        <div className="rounded-[20px] border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-8 md:p-10">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
            <Gift className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="mt-5 font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
            {`// ${t("eyebrow")}`}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{headline}</h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-(--color-muted)">{t("lede")}</p>

          <ul className="mt-6 space-y-2.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14px] text-(--color-text)">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)"
                  strokeWidth={2.4}
                />
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <CalPopupTrigger
              locale={locale}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              {t("ctaCall")}
            </CalPopupTrigger>
            <Link
              href={{ pathname: "/prijzen" as never }}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t("ctaPricing")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 font-mono text-[11px] text-(--color-muted)">
            {isEs
              ? "El descuento se aplica automáticamente al hacer el checkout desde este enlace."
              : "De korting wordt automatisch toegepast als je via deze link je abonnement afsluit."}
          </p>
        </div>
      </RevealOnScroll>
    </main>
  );
}
