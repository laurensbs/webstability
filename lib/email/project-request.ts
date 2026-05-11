// Staff-mail bij een nieuwe aanvraag via de publieke website/webshop-
// configurator (/aanvragen). Bevat alle keuzes + de richtprijs-band + de
// klant-gegevens + een directe link naar de lead-detail in admin.
// Verstuurd door `app/actions/configurator.ts`.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
  wine: "#6B1E2C",
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

const STAFF_NOTIFY_TO = process.env.STAFF_NOTIFY_EMAIL ?? "hello@webstability.eu";
const ADMIN_BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

const eur = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export type ProjectRequestMailInput = {
  leadId: string;
  name: string;
  email: string;
  company: string | null;
  kind: "website" | "webshop";
  pages: number;
  paletteLabel: string;
  customColor: string | null;
  languages: string; // bv. "NL + ES"
  optionLabels: string[];
  message: string | null;
  lowCents: number;
  highCents: number;
  lineSummary: { label: string; cents: number }[];
};

function row(label: string, value: string): string {
  return `<tr><td style="padding:5px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.muted};white-space:nowrap;vertical-align:top;padding-right:14px;">${escapeHtml(label)}</td><td style="padding:5px 0;font-size:14px;line-height:1.5;color:${COLORS.text};">${value}</td></tr>`;
}

export function renderProjectRequestMail(input: ProjectRequestMailInput): {
  html: string;
  text: string;
  subject: string;
} {
  const kindLabel = input.kind === "webshop" ? "Webshop" : "Website";
  const subject = `Nieuwe aanvraag (${kindLabel}) — ${input.company ?? input.name} · ${eur(input.lowCents)}–${eur(input.highCents)}`;
  const leadUrl = `${ADMIN_BASE_URL}/admin/leads/${input.leadId}`;

  const lines = input.lineSummary
    .map(
      (l) =>
        `<tr><td style="padding:3px 0;font-size:13px;color:${COLORS.text};">${escapeHtml(l.label)}</td><td style="padding:3px 0;font-size:13px;color:${COLORS.text};text-align:right;font-variant-numeric:tabular-nums;">${eur(l.cents)}</td></tr>`,
    )
    .join("");

  const bodyTable = `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;">
<p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">// nieuwe configurator-aanvraag</p>
<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(kindLabel)} voor ${escapeHtml(input.company ?? input.name)}</h1>
<p style="margin:10px 0 0 0;font-size:14px;color:${COLORS.muted};">Richtprijs <strong style="color:${COLORS.wine};">${eur(input.lowCents)} – ${eur(input.highCents)}</strong> (±15% schatting).</p>
</td></tr>
<tr><td style="padding:18px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${row("Type", escapeHtml(kindLabel))}
${row("Pagina's", String(input.pages))}
${row("Look", escapeHtml(input.paletteLabel) + (input.customColor ? ` — wens: ${escapeHtml(input.customColor)}` : ""))}
${row("Talen", escapeHtml(input.languages))}
${row("Opties", input.optionLabels.length ? input.optionLabels.map(escapeHtml).join(", ") : "—")}
${row("Naam", escapeHtml(input.name))}
${row("E-mail", `<a href="mailto:${escapeHtml(input.email)}" style="color:${COLORS.accent};">${escapeHtml(input.email)}</a>`)}
${row("Bedrijf", escapeHtml(input.company ?? "—"))}
</table></td></tr>
${input.message ? `<tr><td style="padding:16px 32px 0 32px;"><p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Bericht</p><p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.text};white-space:pre-wrap;">${escapeHtml(input.message)}</p></td></tr>` : ""}
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0 0 6px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Prijs-opbouw</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${COLORS.border};margin-top:4px;padding-top:4px;">${lines}</table></td></tr>
<tr><td style="padding:22px 32px 28px 32px;"><a href="${escapeHtml(leadUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:10px 20px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">Open de lead in admin →</a></td></tr>
</table>`;

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:40px 16px;">${bodyTable}</td></tr></table></body></html>`;

  const text = [
    subject,
    "",
    `Type: ${kindLabel}`,
    `Pagina's: ${input.pages}`,
    `Look: ${input.paletteLabel}${input.customColor ? ` (wens: ${input.customColor})` : ""}`,
    `Talen: ${input.languages}`,
    `Opties: ${input.optionLabels.join(", ") || "—"}`,
    `Naam: ${input.name}`,
    `E-mail: ${input.email}`,
    `Bedrijf: ${input.company ?? "—"}`,
    input.message ? `\nBericht:\n${input.message}` : "",
    "",
    `Richtprijs: ${eur(input.lowCents)} – ${eur(input.highCents)}`,
    ...input.lineSummary.map((l) => `  - ${l.label}: ${eur(l.cents)}`),
    "",
    `Lead: ${leadUrl}`,
  ].join("\n");

  return { html, text, subject };
}

export async function sendProjectRequestMail(input: ProjectRequestMailInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const { html, text, subject } = renderProjectRequestMail(input);
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: STAFF_NOTIFY_TO,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html,
  });
}
