// NPS-vraag-mail — verstuurd op liveAt+30 en liveAt+180. Eén korte
// vraag (0-10 schaal) met token-link naar /portal/nps?token=. Bewust
// minimal: meer dan één klik kost respons-rate.

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

const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

export type NpsAskInput = {
  to: string;
  ownerName: string | null;
  projectName: string;
  askedAfterDays: number; // 30 of 180
  link: string; // /portal/nps?token=...
  locale: "nl" | "es";
};

export async function sendNpsAskMail(input: NpsAskInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");

  const firstName = (input.ownerName ?? "").split(" ")[0]?.trim() || "vriend";
  const isEs = input.locale === "es";
  const subject = isEs
    ? `Una pregunta sobre ${input.projectName}`
    : `Eén vraag over ${input.projectName}`;

  const heading = isEs ? "¿Cómo nos recomendarías?" : "Hoe groot is de kans dat je ons aanbeveelt?";

  const intro = isEs
    ? `Hola ${escapeHtml(firstName)} — ${input.askedAfterDays} días después del lanzamiento de ${escapeHtml(input.projectName)}, una pregunta corta. Tu respuesta queda entre nosotros.`
    : `Hoi ${escapeHtml(firstName)} — ${input.askedAfterDays} dagen na de livegang van ${escapeHtml(input.projectName)}, één korte vraag. Je antwoord blijft tussen ons.`;

  const cta = isEs ? "Responder (1 clic)" : "Beantwoorden (1 klik)";

  const html = `<!doctype html>
<html lang="${input.locale}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;"><p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">// ${input.askedAfterDays} ${isEs ? "días" : "dagen"}</p><h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(heading)}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};">${intro}</p></td></tr>
<tr><td style="padding:24px 32px 28px 32px;"><a href="${escapeHtml(input.link)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:11px 22px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">${escapeHtml(cta)} →</a></td></tr>
<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${COLORS.text};">${isEs ? "Gracias" : "Bedankt"},</p><p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">Laurens Bos</p><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">Founder · Webstability</p></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    heading,
    "",
    intro.replace(/<[^>]+>/g, ""),
    "",
    `${cta}: ${input.link}`,
    "",
    isEs ? "Gracias, Laurens" : "Bedankt, Laurens",
  ].join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: input.to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(input.to),
    subject,
    text,
    html,
  });
}
