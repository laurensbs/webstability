import { AlertTriangle } from "lucide-react";
import {
  stripe,
  isStripeConfigured,
  CARE_PLANS,
  BUILD_EXTENSIONS,
  type CarePlanId,
} from "@/lib/stripe";
import { TIER_PRICES, BUILD_PRICES, type BuildId } from "@/lib/pricing";

/**
 * Server-component die per render de live Stripe-prijzen ophaalt voor élke
 * configured price-ID en vergelijkt met de code-bedragen (TIER_PRICES /
 * BUILD_PRICES). Toont alleen iets als er drift is — de gewone admin-flow
 * wordt niet onderbroken bij correcte sync. Faalt graceful: bij een Stripe-
 * API-fout return't 'ie null (admin-page blijft renderen).
 *
 * Drift kan twee oorzaken hebben:
 *  - De code-prijs is gewijzigd maar het Stripe-product nog niet (klant ziet
 *    Stripe-prijs bij checkout — niet wat op de site staat).
 *  - Het Stripe-product heeft een andere prijs dan de code (idem).
 *
 * Bij drift: de banner zegt welke env-var bijgewerkt moet, of welke prijs in
 * het Stripe-dashboard aangepast moet (afhankelijk van wat de "waarheid" is).
 */
type Mismatch = {
  kind: "plan" | "build";
  id: string;
  envVar: string;
  codeMonthly: number;
  stripeMonthly: number | null;
  stripeCurrency: string | null;
};

async function fetchStripePriceCents(
  priceId: string | null,
): Promise<{ cents: number; currency: string } | null> {
  if (!priceId) return null;
  try {
    const price = await stripe().prices.retrieve(priceId);
    if (typeof price.unit_amount === "number") {
      return { cents: price.unit_amount, currency: (price.currency ?? "eur").toUpperCase() };
    }
    return null;
  } catch {
    return null;
  }
}

export async function StripePriceSyncBanner() {
  if (!isStripeConfigured()) return null;

  const planIds = Object.keys(CARE_PLANS) as CarePlanId[];
  const buildIds = (Object.keys(BUILD_EXTENSIONS) as BuildId[]).filter((b) => b !== "none");

  const planChecks = await Promise.all(
    planIds.map(async (id) => {
      const cfg = CARE_PLANS[id];
      const priceId = process.env[cfg.priceEnv] ?? null;
      const live = await fetchStripePriceCents(priceId);
      const code = TIER_PRICES[id];
      return { id, envVar: cfg.priceEnv, priceId, live, code } as const;
    }),
  );

  const buildChecks = await Promise.all(
    buildIds.map(async (id) => {
      const cfg = BUILD_EXTENSIONS[id as keyof typeof BUILD_EXTENSIONS];
      const priceId = process.env[cfg.priceEnv] ?? null;
      const live = await fetchStripePriceCents(priceId);
      const code = BUILD_PRICES[id];
      return { id, envVar: cfg.priceEnv, priceId, live, code } as const;
    }),
  );

  const mismatches: Mismatch[] = [];
  for (const c of planChecks) {
    if (!c.priceId) continue; // env niet gezet → handled door SetupChecklist
    if (!c.live) continue; // Stripe-API faalde of geen unit_amount → stil
    if (c.live.cents !== c.code * 100) {
      mismatches.push({
        kind: "plan",
        id: c.id,
        envVar: c.envVar,
        codeMonthly: c.code,
        stripeMonthly: c.live.cents / 100,
        stripeCurrency: c.live.currency,
      });
    }
  }
  for (const c of buildChecks) {
    if (!c.priceId) continue;
    if (!c.live) continue;
    if (c.live.cents !== c.code * 100) {
      mismatches.push({
        kind: "build",
        id: c.id,
        envVar: c.envVar,
        codeMonthly: c.code,
        stripeMonthly: c.live.cents / 100,
        stripeCurrency: c.live.currency,
      });
    }
  }

  if (mismatches.length === 0) return null;

  return (
    <section className="rounded-panel border border-(--color-wine)/40 bg-(--color-wine)/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-(--color-wine)"
          strokeWidth={2.2}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
            {"// stripe sync — drift"}
          </p>
          <p className="mt-1 text-[15px] font-medium text-(--color-text)">
            Code-prijzen en Stripe-prijzen lopen uit elkaar
          </p>
          <p className="mt-1 text-[13px] leading-[1.55] text-(--color-muted)">
            De klant betaalt wat in Stripe staat, niet wat de site toont. Update Stripe (of de code)
            zodat ze gelijklopen — anders zien klanten een ander bedrag bij checkout dan op de
            prijzen-pagina.
          </p>
          <ul className="mt-3 space-y-1.5 font-mono text-[12px] text-(--color-text)">
            {mismatches.map((m) => (
              <li key={`${m.kind}-${m.id}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">
                  {m.kind === "plan" ? "tier" : "build"} · {m.id}
                </span>
                <span className="text-(--color-muted)">
                  code €{m.codeMonthly} / Stripe €{m.stripeMonthly}{" "}
                  {m.stripeCurrency && m.stripeCurrency !== "EUR" ? `(${m.stripeCurrency})` : ""}
                </span>
                <span className="text-[10px] tracking-widest text-(--color-muted) uppercase">
                  · {m.envVar}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-(--color-muted)">
            <strong>Fix:</strong> open Stripe Dashboard → Products → de price-row met deze price-ID
            → wijzig naar het code-bedrag. Of: archiveer de huidige price, maak een nieuwe aan met
            het juiste bedrag, en update de env-var in Vercel.
          </p>
        </div>
      </div>
    </section>
  );
}
