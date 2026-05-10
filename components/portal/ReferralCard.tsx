import { Gift, ArrowRight } from "lucide-react";

/**
 * Verschijnt op /portal/dashboard zodra een klant minstens 90 dagen
 * geleden live is gegaan. Strategie: persoonlijk vragen, niet
 * automatiseren — vandaar mailto met pre-gevulde subject. Geen
 * tracking, geen formulier.
 */
export function ReferralCard({
  projectName,
  daysSinceLive,
  locale,
}: {
  projectName: string;
  daysSinceLive: number;
  locale: "nl" | "es";
}) {
  const copy =
    locale === "es"
      ? {
          eyebrow: "pequeño favor",
          title: `${projectName} lleva ${daysSinceLive} días en vivo.`,
          body: "¿Conoces a alguien con el mismo problema con el que empezamos? Si lo recomiendas y se hace cliente, ambos recibís 250 € de descuento sobre Care durante seis meses.",
          cta: "Recomendar a alguien",
        }
      : {
          eyebrow: "klein verzoek",
          title: `${projectName} draait al ${daysSinceLive} dagen live.`,
          body: "Ken je iemand met hetzelfde probleem als waar wij voor jou aan begonnen? Als je 'm doorverwijst en die persoon klant wordt, krijgen jullie allebei €250 korting op Care voor zes maanden.",
          cta: "Iemand doorverwijzen",
        };

  const mailto = `mailto:hello@webstability.eu?subject=${encodeURIComponent(
    `Doorverwijzing — ${projectName}`,
  )}`;

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
          <a
            href={mailto}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase transition-colors hover:text-(--color-wine)"
          >
            {copy.cta}
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </article>
  );
}
