// Maandrapport-mail naar klanten op studio/atelier met een live project.
// Bundelt uptime, uren, tickets resolved en deploys van de afgelopen
// kalendermaand. Verstuurd door cron `/api/cron/monthly-report` op
// de 1e van elke maand 06:00.
//
// NL + ES — locale komt mee uit de user-record (owner.locale). Patroon
// is hetzelfde als weekly-update.ts: één COPY-record met functies +
// strings per locale.

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

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: (project: string, month: string) => string;
    eyebrow: (month: string) => string;
    intro: (firstName: string, month: string) => string;
    metricUptime: string;
    metricHours: string;
    metricTickets: string;
    deploysLine: (n: number, hoursLabel: string) => string;
    hoursZero: string;
    hoursWorked: (h: string) => string;
    whatWeDid: string;
    noHighlights: string;
    openItems: (n: number) => string;
    nextMonth: string;
    upsellHeading: (pct: number) => string;
    upsellBody: (planName: string, planPrice: string) => string;
    openInPortal: string;
    signoff: string;
    senderName: string;
    senderRole: string;
    hi: string;
    snapshotName: (month: string) => string;
    textHeader: (project: string, month: string) => string;
    textUptime: string;
    textHours: string;
    textTickets: string;
    textDeploys: string;
    textWhatWeDid: string;
    textNoHighlights: string;
    textOpen: (n: number) => string;
    textNextMonth: (m: string) => string;
    textPortal: string;
    textReport: string;
  }
> = {
  nl: {
    subject: (project, month) => `Wat ik in ${month} voor je deed — ${project}`,
    eyebrow: (month) => `// maandrapport · ${month}`,
    intro: (first, month) =>
      `Hoi ${first} — een korte terugblik op ${month}, en wat er voor volgende maand op de rol staat.`,
    metricUptime: "Uptime",
    metricHours: "Uren",
    metricTickets: "Tickets opgelost",
    deploysLine: (n, h) => `${n} deploy${n === 1 ? "" : "s"} deze maand · ${h}`,
    hoursZero: "Geen logbare uren deze maand",
    hoursWorked: (h) => `${h}u werk vastgelegd`,
    whatWeDid: "Wat we deden",
    noHighlights: "Geen specifieke highlights deze maand — site draait, werk loopt door.",
    openItems: (n) => `Nog open: ${n} ${n === 1 ? "item" : "items"} — zie portaal.`,
    nextMonth: "Volgende maand",
    upsellHeading: (pct) => `Je zat deze maand op ${pct}% van je uren-budget.`,
    upsellBody: (planName, planPrice) =>
      `Vaker tegen de grens aan? ${planName} (${planPrice}) geeft meer uren + ruimte om door te bouwen. Wisselen kan zelf in je portaal, of stuur me een mailtje.`,
    openInPortal: "Open in portaal",
    signoff: "Tot volgende maand,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
    hi: "vriend",
    snapshotName: (m) => `Maandrapport ${m}`,
    textHeader: (p, m) => `${p} — maandrapport ${m}`,
    textUptime: "Uptime",
    textHours: "Uren",
    textTickets: "Tickets opgelost",
    textDeploys: "Deploys",
    textWhatWeDid: "Wat we deden:",
    textNoHighlights: "- (geen specifieke highlights deze maand)",
    textOpen: (n) => `Open: ${n} item(s) — zie portaal.`,
    textNextMonth: (m) => `Volgende maand: ${m}`,
    textPortal: "Portal",
    textReport: "Rapport",
  },
  es: {
    subject: (project, month) => `Lo que hice por ti en ${month} — ${project}`,
    eyebrow: (month) => `// informe mensual · ${month}`,
    intro: (first, month) =>
      `Hola ${first} — un breve repaso de ${month}, y lo que viene para el mes que entra.`,
    metricUptime: "Uptime",
    metricHours: "Horas",
    metricTickets: "Tickets resueltos",
    deploysLine: (n, h) => `${n} despliegue${n === 1 ? "" : "s"} este mes · ${h}`,
    hoursZero: "Sin horas registradas este mes",
    hoursWorked: (h) => `${h}h de trabajo registradas`,
    whatWeDid: "Lo que hicimos",
    noHighlights: "Sin novedades concretas este mes — el sitio funciona, el trabajo sigue.",
    openItems: (n) => `Pendiente: ${n} ${n === 1 ? "ítem" : "ítems"} — mira el portal.`,
    nextMonth: "Próximo mes",
    upsellHeading: (pct) => `Has usado el ${pct}% de tu presupuesto de horas este mes.`,
    upsellBody: (planName, planPrice) =>
      `¿Te quedas corto a menudo? ${planName} (${planPrice}) te da más horas y margen para seguir construyendo. Puedes cambiar tú mismo en el portal, o escríbeme.`,
    openInPortal: "Abrir en el portal",
    signoff: "Hasta el mes que viene,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
    hi: "amigo",
    snapshotName: (m) => `Informe mensual ${m}`,
    textHeader: (p, m) => `${p} — informe mensual ${m}`,
    textUptime: "Uptime",
    textHours: "Horas",
    textTickets: "Tickets resueltos",
    textDeploys: "Despliegues",
    textWhatWeDid: "Lo que hicimos:",
    textNoHighlights: "- (sin novedades concretas este mes)",
    textOpen: (n) => `Pendiente: ${n} ítem(s) — mira el portal.`,
    textNextMonth: (m) => `Próximo mes: ${m}`,
    textPortal: "Portal",
    textReport: "Informe",
  },
};

export type MonthlyReportInput = {
  to: string;
  ownerName: string | null;
  projectName: string;
  monthLabel: string; // bv. "april 2026" / "abril 2026"
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
  locale?: Locale;
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
  snapshotName: string;
} {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const firstName = (input.ownerName ?? "").split(" ")[0]?.trim() || t.hi;
  const subject = t.subject(input.projectName, input.monthLabel);
  const uptimeLabel = `${input.uptimePct.toFixed(2)}%`;
  const hoursLabel =
    input.hoursMinutes === 0 ? t.hoursZero : t.hoursWorked((input.hoursMinutes / 60).toFixed(1));

  const highlightsHtml =
    input.highlights.length === 0
      ? `<p style="margin:0;font-size:14px;color:${COLORS.muted};font-style:italic;">${escapeHtml(t.noHighlights)}</p>`
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
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(t.metricUptime)}</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.success};">${escapeHtml(uptimeLabel)}</p>
      </td>
      <td style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px;text-align:center;width:33%;">
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(t.metricHours)}</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.text};">${(input.hoursMinutes / 60).toFixed(1)}</p>
      </td>
      <td style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px;text-align:center;width:33%;">
        <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(t.metricTickets)}</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.text};">${input.ticketsResolved}</p>
      </td>
    </tr>
  </table>`;

  const deploysLine =
    input.deploys > 0
      ? `<p style="margin:8px 0 0 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(t.deploysLine(input.deploys, hoursLabel))}</p>`
      : `<p style="margin:8px 0 0 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(hoursLabel)}</p>`;

  const openItemsLine =
    input.openItems > 0
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:${COLORS.wine};">${escapeHtml(t.openItems(input.openItems))}</p>`
      : "";

  // "Wat we volgende maand willen oppakken" — geeft het rapport een
  // vooruitblik i.p.v. alleen terugblik. Alleen als er een mijlpaal is.
  const nextMonthRow = input.nextMilestone?.trim()
    ? `<tr><td style="padding:22px 32px 0 32px;"><p style="margin:0 0 10px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.wine};">${escapeHtml(t.nextMonth)}</p><p style="margin:0;font-size:14px;line-height:1.55;color:${COLORS.text};">${escapeHtml(input.nextMilestone.trim())}</p></td></tr>`
    : "";

  // Upsell-hook — alleen tonen als de klant duidelijk tegen zijn uren-
  // budget aanzit én er een hoger plan is. Subtiel, niet pusherig.
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
      ? `<tr><td style="padding:18px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;"><tr><td style="padding:14px 16px;"><p style="margin:0 0 4px 0;font-size:13px;line-height:1.5;color:${COLORS.text};"><strong>${escapeHtml(t.upsellHeading(Math.round(usagePct * 100)))}</strong></p><p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(t.upsellBody(upgradeTarget.name, upgradeTarget.price))}</p></td></tr></table></td></tr>`
      : "";

  const ctaRow = input.portalUrl
    ? `<tr><td style="padding:18px 32px 28px 32px;"><a href="${escapeHtml(input.portalUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:11px 22px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">${escapeHtml(t.openInPortal)} →</a></td></tr>`
    : "";

  const bodyTable = `<table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;"><p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">${escapeHtml(t.eyebrow(input.monthLabel))}</p><h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${COLORS.text};">${escapeHtml(input.projectName)}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(t.intro(firstName, input.monthLabel))}</p></td></tr>
<tr><td style="padding:22px 32px 0 32px;">${metricsRow}${deploysLine}</td></tr>
<tr><td style="padding:22px 32px 0 32px;"><p style="margin:0 0 10px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(t.whatWeDid)}</p>${highlightsHtml}${openItemsLine}</td></tr>
${nextMonthRow}
${upsellRow}
${ctaRow}
<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${COLORS.text};">${escapeHtml(t.signoff)}</p><p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">${escapeHtml(t.senderName)}</p><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(t.senderRole)}</p></td></tr>
</table>`;

  const mailHtml = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:48px 16px;">
${bodyTable}
</td></tr></table></body></html>`;

  // Snapshot — zonder portal-CTA en zonder upsell-hook (een print/PDF-
  // snapshot mag geen sales-blokje bevatten), met een title-tag.
  const snapshotBody = bodyTable.replace(ctaRow, "").replace(upsellRow, "");
  const snapshotHtml = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:48px 16px;">${snapshotBody}</td></tr></table></body></html>`;

  const textParts = [
    t.textHeader(input.projectName, input.monthLabel),
    "",
    `${locale === "es" ? "Hola" : "Hoi"} ${firstName},`,
    "",
    `${t.textUptime}: ${uptimeLabel}`,
    `${t.textHours}: ${(input.hoursMinutes / 60).toFixed(1)}u`,
    `${t.textTickets}: ${input.ticketsResolved}`,
    `${t.textDeploys}: ${input.deploys}`,
    "",
    t.textWhatWeDid,
  ];
  if (input.highlights.length === 0) {
    textParts.push(t.textNoHighlights);
  } else {
    for (const h of input.highlights) textParts.push(`- ${h}`);
  }
  if (input.openItems > 0) {
    textParts.push("", t.textOpen(input.openItems));
  }
  if (input.nextMilestone?.trim()) {
    textParts.push("", t.textNextMonth(input.nextMilestone.trim()));
  }
  if (usagePct >= 0.75 && upgradeTarget) {
    textParts.push(
      "",
      `${t.upsellHeading(Math.round(usagePct * 100))} ${t.upsellBody(upgradeTarget.name, upgradeTarget.price)}`,
    );
  }
  textParts.push("", `${t.textPortal}: ${input.portalUrl}`);
  if (input.reportUrl) textParts.push(`${t.textReport}: ${input.reportUrl}`);

  return {
    mailHtml,
    snapshotHtml,
    text: textParts.join("\n"),
    subject,
    snapshotName: t.snapshotName(input.monthLabel),
  };
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
