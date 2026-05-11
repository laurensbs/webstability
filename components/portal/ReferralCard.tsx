import { Gift } from "lucide-react";
import { getMyReferralCode } from "@/app/actions/referrals";
import { ReferralShareButton } from "@/components/portal/ReferralShareButton";

const APP_URL = process.env.AUTH_URL ?? "https://webstability.eu";

/**
 * Verschijnt op /portal/dashboard zodra een klant minstens 90 dagen
 * geleden live is gegaan. Strategie: persoonlijk vragen op het moment
 * dat het systeem zijn waarde heeft bewezen.
 *
 * Toont een deelbare /refer/[code]-link met kopieer-knop. Wie via die
 * link checkout doet, krijgt automatisch de Stripe-coupon REFERRAL_250;
 * de korting wordt door de Stripe-webhook geregeld.
 */
export async function ReferralCard({
  projectName,
  daysSinceLive,
  locale,
}: {
  projectName: string;
  daysSinceLive: number;
  locale: "nl" | "es";
}) {
  const code = await getMyReferralCode();
  const link = code ? `${APP_URL}/${locale === "es" ? "es/" : ""}refer/${code}` : null;

  const copy =
    locale === "es"
      ? {
          eyebrow: "pequeño favor",
          title: `${projectName} lleva ${daysSinceLive} días en vivo.`,
          body: "¿Conoces a alguien con el mismo problema con el que empezamos? Comparte tu enlace — si se hace cliente, ambos recibís 250 € de descuento sobre Care durante seis meses.",
          linkLabel: "Tu enlace para compartir",
          copyLabel: "Copiar enlace",
          copiedLabel: "¡Copiado!",
          fallback: "El enlace estará disponible en breve.",
        }
      : {
          eyebrow: "klein verzoek",
          title: `${projectName} draait al ${daysSinceLive} dagen live.`,
          body: "Ken je iemand met hetzelfde probleem als waar wij voor jou aan begonnen? Deel je link — wordt die persoon klant, dan krijgen jullie allebei €250 korting op Care voor zes maanden.",
          linkLabel: "Jouw deelbare link",
          copyLabel: "Kopieer link",
          copiedLabel: "Gekopieerd!",
          fallback: "De link komt zo beschikbaar.",
        };

  return (
    <article className="relative overflow-hidden rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-(--color-accent-soft) opacity-60 blur-3xl"
      />
      <div className="relative flex items-start gap-4">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
          <Gift className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
            {`// ${copy.eyebrow}`}
          </p>
          <h3 className="mt-1.5 font-serif text-[20px] leading-tight text-(--color-text)">
            {copy.title}
          </h3>
          <p className="mt-3 text-[14px] leading-[1.6] text-(--color-muted)">{copy.body}</p>

          {link ? (
            <div className="mt-4">
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {copy.linkLabel}
              </p>
              <ReferralShareButton
                link={link}
                copyLabel={copy.copyLabel}
                copiedLabel={copy.copiedLabel}
              />
            </div>
          ) : (
            <p className="mt-4 font-mono text-[11px] text-(--color-muted)">{copy.fallback}</p>
          )}
        </div>
      </div>
    </article>
  );
}
