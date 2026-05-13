// "Hé, ik had je beloofd binnen 1 werkdag terug te komen op je
// configurator-aanvraag — even mijn excuses dat het iets langer duurde."
//
// Eénmalige, persoonlijke mail die uitgaat als een configurator-lead
// is blijven liggen tot na `nextActionAt`. Bewust *niet* een tweede
// pitch — alleen acknowledgement + concreet moment ("ik kom morgen
// écht bij je terug"). Toon: Laurens' stem, kort, één-op-één.
//
// Faalt graceful — caller (cron) vangt 'm en logt.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  bgWarm: "#EFE8DB",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
};

const SMTP_SERVER = {
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

const MAIL_FROM = process.env.EMAIL_FROM ?? "Webstability <hello@webstability.eu>";
const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: string;
    eyebrow: string;
    heading: string;
    greeting: (first: string) => string;
    apology: string;
    promise: string;
    closer: string;
    signoff: string;
    senderName: string;
    senderRole: string;
  }
> = {
  nl: {
    subject: "Even kort — ik kom morgen bij je terug",
    eyebrow: "// configurator-aanvraag",
    heading: "Sorry dat 't iets langer duurt.",
    greeting: (f) => `Hoi ${f},`,
    apology:
      "Je had via de configurator een aanvraag gedaan en ik had beloofd binnen 1 werkdag bij je terug te komen — dat is me niet helemaal gelukt. Mijn excuses.",
    promise:
      "Ik heb je aanvraag wel gewoon op m'n bureau liggen en ben er morgen mee aan de slag — ik mail je vóór het einde van de dag met een vaste offerte en een paar mogelijke planningen.",
    closer:
      "Mocht je intussen al iets willen toelichten of vragen hebben, beantwoord deze mail dan gewoon — dat komt rechtstreeks bij mij binnen.",
    signoff: "Tot snel,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
  },
  es: {
    subject: "Un mensaje rápido — mañana te contesto",
    eyebrow: "// solicitud del configurador",
    heading: "Perdona el pequeño retraso.",
    greeting: (f) => `Hola ${f},`,
    apology:
      "Hiciste una solicitud por el configurador y te había prometido contestar en 1 día laborable — no lo he conseguido del todo. Mis disculpas.",
    promise:
      "Tu solicitud sigue encima de mi mesa y mañana me pongo con ella — te escribo antes del final del día con un presupuesto fijo y un par de planificaciones posibles.",
    closer:
      "Si mientras tanto quieres aclarar algo o tienes preguntas, simplemente responde a este correo — me llega directamente.",
    signoff: "Hasta pronto,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
  },
};

export async function sendConfiguratorWarmReminder(input: {
  to: string;
  name: string | null;
  locale?: string;
}): Promise<void> {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const first = (input.name ?? "").split(" ")[0]?.trim() || (locale === "es" ? "hola" : "hoi");

  const html = `<!doctype html><html><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
        <tr><td style="padding:28px 28px 6px">
          <p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.25;color:${COLORS.text}">${escapeHtml(t.heading)}</h1>
          <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.greeting(first))}</p>
          <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.65">${escapeHtml(t.apology)}</p>
          <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.65">${escapeHtml(t.promise)}</p>
          <p style="margin:0 0 0;color:${COLORS.muted};font-size:14px;line-height:1.65">${escapeHtml(t.closer)}</p>
        </td></tr>
        <tr><td style="padding:18px 28px 28px">
          <p style="margin:0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.senderName)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
        </td></tr>
        <tr><td style="padding:14px 28px;background:${COLORS.bgWarm};border-top:1px solid ${COLORS.border}">
          <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.5">${escapeHtml(
            locale === "es"
              ? "Un sistema que funciona — construido y mantenido por una persona."
              : "Eén systeem dat draait — gebouwd en in de lucht gehouden door één persoon.",
          )}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${t.heading}

${t.greeting(first)}

${t.apology}

${t.promise}

${t.closer}

${t.signoff}
${t.senderName} — ${t.senderRole}`;

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: input.to,
    bcc: auditBcc(input.to),
    subject: t.subject,
    html,
    text,
  });
}
