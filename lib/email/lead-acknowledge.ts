// Korte "ik heb je aanvraag gezien"-mail naar een configurator- of
// contactform-lead. Niet automatisch — staff drukt op de knop in
// /admin/leads/[id]. Doel: tussen submit en de echte reactie zit nu een
// stille periode tot 1 werkdag; deze mail dempt die met een
// menselijke, korte acknowledgment in jouw toon. Geen sales-pitch.
// Brand-styled in dezelfde stijl als configurator-confirm / set-password.

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
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstability.eu").replace(/\/$/, "");

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: string;
    eyebrow: string;
    heading: string;
    intro: (firstName: string) => string;
    body: string;
    ctaIntro: string;
    cta: string;
    signoff: string;
    sender: string;
    senderRole: string;
    hi: string;
  }
> = {
  nl: {
    subject: "Je aanvraag is binnen — kort berichtje van mij",
    eyebrow: "// aangekomen",
    heading: "Gezien.",
    intro: (n) => `Hoi ${n},`,
    body: "Even een kort persoonlijk berichtje: je aanvraag staat bij me, ik heb 'm gelezen, en ik kom binnen één werkdag bij je terug. Geen automatisch antwoord — gewoon zodat je weet dat 'ie niet ergens in een spam-folder verdwenen is.",
    ctaIntro: "Liever sneller? Boek dan een korte kennismaking:",
    cta: "Plan een gesprek",
    signoff: "Tot snel,",
    sender: "Laurens Bos",
    senderRole: "Webstability",
    hi: "vriend",
  },
  es: {
    subject: "Tu solicitud ha llegado — un breve mensaje mío",
    eyebrow: "// recibida",
    heading: "Recibida.",
    intro: (n) => `Hola ${n},`,
    body: "Un breve mensaje personal: tu solicitud está conmigo, la he leído, y te contesto en un día laborable. No es una respuesta automática — solo para que sepas que no se ha perdido en la carpeta de spam.",
    ctaIntro: "¿Prefieres antes? Reserva una llamada corta:",
    cta: "Reservar una charla",
    signoff: "Hasta pronto,",
    sender: "Laurens Bos",
    senderRole: "Webstability",
    hi: "amigo",
  },
};

export async function sendLeadAcknowledgeMail(input: {
  to: string;
  name: string | null;
  locale?: Locale;
}): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");

  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const first = (input.name ?? "").split(" ")[0]?.trim() || t.hi;
  const calPath = locale === "es" ? "/es/contacto" : "/contact";

  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
      <tr><td style="padding:28px 30px 0">
        <p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(t.heading)}</h1>
        <p style="margin:8px 0 0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.intro(first))}</p>
        <p style="margin:14px 0 0;color:${COLORS.muted};font-size:15px;line-height:1.6">${escapeHtml(t.body)}</p>
      </td></tr>
      <tr><td style="padding:24px 30px 8px">
        <p style="margin:0 0 10px;color:${COLORS.muted};font-size:14px;line-height:1.6">${escapeHtml(t.ctaIntro)}</p>
        <a href="${SITE_URL}${calPath}" style="display:inline-block;background:${COLORS.text};color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:999px">${escapeHtml(t.cta)} →</a>
      </td></tr>
      <tr><td style="padding:22px 30px 26px">
        <p style="margin:0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.sender)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `${t.heading}\n\n${t.intro(first)}\n\n${t.body}\n\n${t.ctaIntro}\n${SITE_URL}${calPath}\n\n${t.signoff}\n${t.sender} — ${t.senderRole}`;

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
