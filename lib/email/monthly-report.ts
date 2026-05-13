// Maandrapport-mail naar klanten op studio/atelier met een live project.
// Bundelt uptime, uren, tickets resolved en deploys van de afgelopen
// kalendermaand. Verstuurd door cron `/api/cron/monthly-report` op
// de 1e van elke maand 06:00.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  bgWarm: "#EFE8DB",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
  wine: "#6B1E2C",
  success: "#3F7D58",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SMTP_SERVER = {
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

export type MonthlyReportInput = {
  to: string;
  ownerName: string | null;
  projectName: string;
  monthLabel: string; // bv. "april 2026"
  uptimePct: number; // 0-100
  hoursMinutes: number;
  ticketsResolved: number;
  deploys: number;
  highlights: string[]; // 0..3 korte zinnen "wat we deden"
  openItems: number;
  portalUrl: string;
  reportUrl: string | null; // link naar HTML-snapshot (optioneel)
  /** De "volgende mijlpaal"-tekst van het project (staff vult die per
   * week). Wordt als "wat we volgende maand willen oppakken" getoond
   * — geeft de klant het gevoel dat er een plan is. Null = sectie weg. */
  nextMilestone?: string | null;
  /** Plan + uren-budget voor de upsell-hook. Als de klant >75% van
   * zijn maand-uren gebruikt heeft én niet op het hoogste plan zit,
   * tonen we een subtiele "wil je naar X?"-regel. Beide null = hook weg. */
  plan?: "care" | "studio" | "atelier" | null;
  hoursBudgetMinutes?: number | null;
};

/**
 * Bouwt zowel de mail-HTML als een standalone HTML-string die we in
 * blob storen als "rapport-snapshot". Snapshot is dezelfde body
 * zonder de "open in portaal"-CTA — pure print/PDF-bestendig.
 */
export function renderMonthlyReportHtml(input: MonthlyReportInput): {
  mailHtml: string;
  snapshotHtml: string;
  text: string;
  subject: string;
} {
  const firstName = (input.ownerName ?? "").split(" ")[0]?.trim() || "vriend";
  // Persoonlijker dan "Maandrapport — X (april 2026)" — past bij de toon
  // van de mail-inhoud (eerste-persoon "Hoi {name} — terugblik op {month}").
  // TODO (i18n): hele mail is NL-only; ES-klanten krijgen dus Nederlands.
  // Dezelfde locale-split als weekly-update.ts heeft. Aparte commit waard.
  const subject = `Wat ik in ${input.monthLabel} voor je deed — ${input.projectName}`;
  const uptimeLabel = `${input.uptimePct.toFixed(2)}%`;
  const hoursLabel =
    input.hoursMinutes === 0
      ? "Geen logbare uren deze maand"
      : `${(input.hoursMinutes / 60).toFixed(1)}u werk vastgelegd`;

  const highlightsHtml =
    input.highlights.length === 0
      ? `<p style="margin:0;font-size:14px;color:${COLORS.muted};font-style:italic;">Geen specifieke highlights deze maand — site draait, werk loopt door.</p>`
      : `<ul style="margin:0;padding-left:18px;">${input.highlights
          .map(
            (h) =>
              `<li style="margin:0 0 6px 0;font-size:14px;line-height:1.55;color:${COLORS.text};">${escapeHtml(
                h,
              )}</li>`,
          )
          .join("")}</ul>`;

  const metricsRow = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:8px 0;">
    <tr>
      <td style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px;text-align:center;width:33%;">
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Uptime</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.success};">${escapeHtml(uptimeLabel)}</p>
      </td>
      <td style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px;text-align:center;width:33%;">
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Uren</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.text};">${(input.hoursMinutes / 60).toFixed(1)}</p>
      </td>
      <td style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px;text-align:center;width:33%;">
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Tickets opgelost</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.text};">${input.ticketsResolved}</p>
      </td>
    </tr>
  </table>`;

  const deploysLine =
    input.deploys > 0
      ? `<p style="margin:8px 0 0 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${input.deploys} deploy${input.deploys === 1 ? "" : "s"} deze maand · ${escapeHtml(hoursLabel)}</p>`
      : `<p style="margin:8px 0 0 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(hoursLabel)}</p>`;

  const openItemsLine =
    input.openItems > 0
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:${COLORS.wine};">Nog open: ${input.openItems} ${input.openItems === 1 ? "item" : "items"} — zie portaal.</p>`
      : "";

  // "Wat we volgende maand willen oppakken" — geeft het rapport een
  // vooruitblik i.p.v. alleen terugblik. Alleen als er een mijlpaal is.
  const nextMonthRow = input.nextMilestone?.trim()
    ? `<tr><td style="padding:22px 32px 0 32px;"><p style="margin:0 0 10px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.wine};">Volgende maand</p><p style="margin:0;font-size:14px;line-height:1.55;color:${COLORS.text};">${escapeHtml(input.nextMilestone.trim())}</p></td></tr>`
    : "";

  // Upsell-hook — alleen tonen als de klant duidelijk tegen zijn uren-
  // budget aanzit én er een hoger plan is. Subtiel, niet pusherig:
  // "je zit er bijna doorheen, wil je meer ruimte?".
  const usagePct =
    input.hoursBudgetMinutes && input.hoursBudgetMinutes > 0
      ? input.hoursMinutes / input.hoursBudgetMinutes
      : 0;
  const nextPlan: Record<string, { name: string; price: string } | null> = {
    care: { name: "Studio", price: "€179/m" },
    studio: { name: "Atelier", price: "€399/m" },
    atelier: null,
  };
  const upgradeTarget = input.plan ? nextPlan[input.plan] : null;
  const upsellRow =
    usagePct >= 0.75 && upgradeTarget
      ? `<tr><td style="padding:18px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;"><tr><td style="padding:14px 16px;"><p style="margin:0 0 4px 0;font-size:13px;line-height:1.5;color:${COLORS.text};"><strong>Je zat deze maand op ${Math.round(usagePct * 100)}% van je uren-budget.</strong></p><p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.muted};">Vaker tegen de grens aan? ${escapeHtml(upgradeTarget.name)} (${escapeHtml(upgradeTarget.price)}) geeft meer uren + ruimte om door te bouwen. Wisselen kan zelf in je portaal, of stuur me een mailtje.</p></td></tr></table></td></tr>`
      : "";

  const ctaRow = input.portalUrl
    ? `<tr><td style="padding:18px 32px 28px 32px;"><a href="${escapeHtml(input.portalUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:11px 22px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">Open in portaal →</a></td></tr>`
    : "";

  const bodyTable = `<table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;"><p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">// maandrapport · ${escapeHtml(input.monthLabel)}</p><h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${COLORS.text};">${escapeHtml(input.projectName)}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};">Hoi ${escapeHtml(firstName)} — een korte terugblik op ${escapeHtml(input.monthLabel)}, en wat er voor volgende maand op de rol staat.</p></td></tr>
<tr><td style="padding:22px 32px 0 32px;">${metricsRow}${deploysLine}</td></tr>
<tr><td style="padding:22px 32px 0 32px;"><p style="margin:0 0 10px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Wat we deden</p>${highlightsHtml}${openItemsLine}</td></tr>
${nextMonthRow}
${upsellRow}
${ctaRow}
<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${COLORS.text};">Tot volgende maand,</p><p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">Laurens Bos</p><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">Founder · Webstability</p></td></tr>
</table>`;

  const mailHtml = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:48px 16px;">
${bodyTable}
</td></tr></table></body></html>`;

  // Snapshot — zonder portal-CTA en zonder upsell-hook (een print/PDF-
  // snapshot mag geen sales-blokje bevatten), met een title-tag.
  const snapshotBody = bodyTable.replace(ctaRow, "").replace(upsellRow, "");
  const snapshotHtml = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:48px 16px;">${snapshotBody}</td></tr></table></body></html>`;

  const textParts = [
    `${input.projectName} — maandrapport ${input.monthLabel}`,
    "",
    `Hoi ${firstName},`,
    "",
    `Uptime: ${uptimeLabel}`,
    `Uren: ${(input.hoursMinutes / 60).toFixed(1)}u`,
    `Tickets opgelost: ${input.ticketsResolved}`,
    `Deploys: ${input.deploys}`,
    "",
    "Wat we deden:",
  ];
  if (input.highlights.length === 0) {
    textParts.push("- (geen specifieke highlights deze maand)");
  } else {
    for (const h of input.highlights) textParts.push(`- ${h}`);
  }
  if (input.openItems > 0) {
    textParts.push("", `Open: ${input.openItems} item(s) — zie portaal.`);
  }
  if (input.nextMilestone?.trim()) {
    textParts.push("", `Volgende maand: ${input.nextMilestone.trim()}`);
  }
  if (usagePct >= 0.75 && upgradeTarget) {
    textParts.push(
      "",
      `Je zat op ${Math.round(usagePct * 100)}% van je uren-budget — ${upgradeTarget.name} (${upgradeTarget.price}) geeft meer ruimte. Wisselen kan in je portaal.`,
    );
  }
  textParts.push("", `Portal: ${input.portalUrl}`);
  if (input.reportUrl) textParts.push(`Rapport: ${input.reportUrl}`);

  return { mailHtml, snapshotHtml, text: textParts.join("\n"), subject };
}

export async function sendMonthlyReportMail(input: MonthlyReportInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const { mailHtml, text, subject } = renderMonthlyReportHtml(input);
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: input.to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(input.to),
    subject,
    text,
    html: mailHtml,
  });
}
