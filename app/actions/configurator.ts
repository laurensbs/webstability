"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { leads, leadActivity } from "@/lib/db/schema";
import {
  estimateProjectPrice,
  CONFIG_OPTIONS,
  CONFIG_PALETTES,
  PROJECT_MAX_PAGES,
  PROJECT_PAGES_INCLUDED,
  type ProjectKind,
  type ConfigOptionId,
  type ConfigPaletteId,
  type ConfigLanguageId,
} from "@/lib/pricing";
import { sendProjectRequestMail } from "@/lib/email/project-request";
import { sendConfiguratorConfirmMail } from "@/lib/email/configurator-confirm";

const KINDS: ProjectKind[] = ["website", "webshop"];
const LANGS: ConfigLanguageId[] = ["nl", "nl_es", "nl_es_en"];

/** Server-side weergave van de keuzes (de e-mail/admin tonen labels — die
 * vertaling doet de UI; hier houden we de keys + een korte NL-fallback). */
const LANG_LABEL: Record<ConfigLanguageId, string> = {
  nl: "Nederlands",
  nl_es: "NL + ES",
  nl_es_en: "NL + ES + EN",
};
const PALETTE_LABEL: Record<ConfigPaletteId, string> = {
  warm: "Warm & ambachtelijk",
  modern: "Strak & modern",
  dark: "Donker & premium",
  fresh: "Fris & licht",
  bold: "Stoer & contrastrijk",
};
const OPTION_LABEL: Record<ConfigOptionId, string> = {
  multilingual: "Meertalig (volwaardig)",
  inventorySync: "Voorraad-koppeling",
  blog: "Blog / nieuws met CMS",
  customDesign: "Eigen design",
  copywriting: "Wij schrijven de teksten",
  bookingForm: "Afspraak-/aanvraagformulier",
};

export type ProjectRequestResult =
  | { ok: true; leadId: string; lowCents: number; highCents: number }
  | { ok: false; error: "missing_fields" | "invalid_email" | "failed" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Verwerkt een aanvraag uit de publieke website/webshop-configurator.
 * Geen auth — dit is een publiek formulier (zoals het contact-form).
 * Maakt een `leads`-row (`source: 'configurator'`) + een leadActivity-
 * entry met alle keuzes + de server-side herberekende richtprijs, en
 * mailt Laurens. De prijs wordt server-side opnieuw berekend zodat een
 * gemanipuleerde client geen onzin-bedrag kan injecteren.
 */
export async function submitProjectRequest(formData: FormData): Promise<ProjectRequestResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const localeInput = String(formData.get("locale") ?? "nl");
  const locale = localeInput === "es" ? "es" : "nl";
  const kindInput = String(formData.get("kind") ?? "");
  const pagesInput = Number(formData.get("pages") ?? 0);
  const paletteInput = String(formData.get("palette") ?? "");
  const customColor = String(formData.get("customColor") ?? "").trim();
  const languageInput = String(formData.get("language") ?? "nl");
  // options komt als komma-gescheiden lijst van ids
  const optionsRaw = String(formData.get("options") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !email) return { ok: false, error: "missing_fields" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "invalid_email" };

  const kind = (KINDS as readonly string[]).includes(kindInput)
    ? (kindInput as ProjectKind)
    : "website";
  const included = PROJECT_PAGES_INCLUDED[kind];
  const pages = Math.max(included, Math.min(PROJECT_MAX_PAGES, Math.round(pagesInput) || included));
  const palette = (paletteInput in CONFIG_PALETTES ? paletteInput : "warm") as ConfigPaletteId;
  const language = (LANGS as readonly string[]).includes(languageInput)
    ? (languageInput as ConfigLanguageId)
    : "nl";
  const options = optionsRaw.filter((id): id is ConfigOptionId => id in CONFIG_OPTIONS);

  const estimate = estimateProjectPrice({ kind, pages, options });

  try {
    const [lead] = await db
      .insert(leads)
      .values({
        email,
        name: name || null,
        company: company || null,
        source: "configurator",
        status: "warmed",
        nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        nextActionLabel: "Configurator-aanvraag opvolgen",
      })
      .returning({ id: leads.id });

    await db.insert(leadActivity).values({
      leadId: lead.id,
      kind: "note_added",
      summary: `Configurator-aanvraag: ${kind === "webshop" ? "webshop" : "website"}, ${pages} pagina's — richtprijs €${Math.round(estimate.lowCents / 100)}–€${Math.round(estimate.highCents / 100)}`,
      metadata: {
        type: "configurator_submit",
        kind,
        pages,
        palette,
        customColor: customColor || null,
        language,
        options,
        message: message || null,
        estimate: {
          lowCents: estimate.lowCents,
          highCents: estimate.highCents,
          midCents: estimate.midCents,
          lines: estimate.lines,
        },
      },
    });

    try {
      await sendProjectRequestMail({
        leadId: lead.id,
        name,
        email,
        company: company || null,
        kind,
        pages,
        paletteLabel: PALETTE_LABEL[palette],
        customColor: customColor || null,
        languages: LANG_LABEL[language],
        optionLabels: options.map((id) => OPTION_LABEL[id]),
        message: message || null,
        lowCents: estimate.lowCents,
        highCents: estimate.highCents,
        lineSummary: estimate.lines.map((l) => ({
          // Een leesbare NL-fallback per labelKey voor de mail.
          label: humanLine(l.labelKey, l.meta),
          cents: l.cents,
        })),
      });
    } catch (mailErr) {
      console.error("[configurator] notify mail failed:", mailErr);
      // Lead is opgeslagen; alleen de mail mislukte — niet fataal.
    }

    // Bevestigingsmail naar de prospect zelf — recap van de keuzes + richtprijs
    // + "wat gebeurt er nu". Faalt graceful (lead + admin-mail zijn al rond).
    try {
      await sendConfiguratorConfirmMail({
        to: email,
        name: name || null,
        locale,
        kind,
        lowCents: estimate.lowCents,
        highCents: estimate.highCents,
        lineSummary: estimate.lines.map((l) => ({
          label: humanLine(l.labelKey, l.meta),
          cents: l.cents,
        })),
      });
    } catch (confirmErr) {
      console.error("[configurator] prospect confirm mail failed:", confirmErr);
    }

    // Bewaar een compacte samenvatting in een cookie zodat áls deze
    // bezoeker later via checkout klant wordt, de portal-intake al deels
    // is voorgevuld (build-type = website/webshop, details = de keuzes).
    // 30 dagen geldig, niet HttpOnly nodig (geen secret), sameSite=lax.
    try {
      const detailsLine = [
        kind === "webshop"
          ? "Webshop-aanvraag via de configurator"
          : "Website-aanvraag via de configurator",
        `${pages} pagina's`,
        `look: ${PALETTE_LABEL[palette]}${customColor ? ` (wens: ${customColor})` : ""}`,
        `talen: ${LANG_LABEL[language]}`,
        options.length ? `opties: ${options.map((id) => OPTION_LABEL[id]).join(", ")}` : null,
        message ? `\n\n${message}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const prefill = {
        company: { name: company || null },
        // De intake-stap "type systeem" kent: verhuurplatform | reparatie |
        // webshop ("website of webshop") | anders. De configurator produceert
        // alleen website/webshop → beide vallen onder de intake-optie "webshop".
        build: { type: "webshop", details: detailsLine },
      };
      const jar = await cookies();
      jar.set("wb_proj_request", JSON.stringify(prefill), {
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        path: "/",
      });
    } catch (cookieErr) {
      console.error("[configurator] prefill cookie failed:", cookieErr);
    }

    return {
      ok: true,
      leadId: lead.id,
      lowCents: estimate.lowCents,
      highCents: estimate.highCents,
    };
  } catch (err) {
    console.error("[configurator] submit failed:", err);
    return { ok: false, error: "failed" };
  }
}

function humanLine(labelKey: string, meta?: Record<string, unknown>): string {
  if (labelKey === "base.website")
    return `Website-basis (incl. ${meta?.includedPages ?? 5} pagina's)`;
  if (labelKey === "base.webshop")
    return `Webshop-basis (incl. ${meta?.includedPages ?? 8} pagina's)`;
  if (labelKey === "extraPages") return `${meta?.count ?? 0} extra pagina's`;
  if (labelKey.startsWith("options.")) {
    const id = labelKey.slice("options.".length) as ConfigOptionId;
    return OPTION_LABEL[id] ?? id;
  }
  return labelKey;
}
