// Outbound mail-templates voor leads. Vier varianten parallel aan de
// strategie: koude intro, opvolg na call, dormant revive, referral
// request. Bewust eenvoudig HTML — geen marketing-emails maar
// persoonlijke berichten in Laurens' stem.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
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

export type OutreachTemplate =
  | "lead_outreach_intro"
  | "lead_followup_after_call"
  | "lead_referral_request"
  | "lead_dormant_revive";

export type OutreachInput = {
  to: string;
  leadName: string | null;
  template: OutreachTemplate;
  customSubject?: string;
  customBody?: string; // markdown-light; \n wordt <br>
};

const FIRST_NAME = (name: string | null) => (name ?? "").split(" ")[0]?.trim() || "vriend";

function defaultsFor(template: OutreachTemplate, leadName: string | null) {
  const first = FIRST_NAME(leadName);
  switch (template) {
    case "lead_outreach_intro":
      return {
        subject: "Korte vraag",
        body: `Hoi ${first},

Ik kwam jouw bedrijf tegen en het viel me op. Webstability bouwt webportals voor verhuurders aan de Costa Brava — strak, mobiel-first, met een knipoog.

Mocht je benieuwd zijn naar wat ik voor jullie zou kunnen doen — een korte demo van een eigen-merk klantportaal — stuur me dan een reactie. Geen pitch, geen reclame.

Groet,
Laurens`,
      };
    case "lead_followup_after_call":
      return {
        subject: "Na ons gesprek",
        body: `Hoi ${first},

Fijn dat we elkaar gesproken hebben. Zoals beloofd stuur ik je een korte samenvatting van wat we besproken hebben — laat me weten of het accuraat is en of er nog open punten zijn.

Groet,
Laurens`,
      };
    case "lead_referral_request":
      return {
        subject: "Een gunst — ken jij iemand?",
        body: `Hoi ${first},

We werken nu een paar maanden samen — bedankt voor het vertrouwen.

Als je iemand kent die zou kunnen profiteren van een vergelijkbaar traject (klantportaal, modern, klein-en-fijn), zou ik het zeer waarderen als je mijn naam laat vallen. Stuur ze gerust deze mail door.

Groet,
Laurens`,
      };
    case "lead_dormant_revive":
      return {
        subject: "Hé — alles goed?",
        body: `Hoi ${first},

Ik realiseer me dat we elkaar een tijdje niet gesproken hebben. Geen verkoop-mail — gewoon een check-in: is het project waar je toen mee bezig was inmiddels gelukt, of zou je er nog graag eens over praten?

Groet,
Laurens`,
      };
  }
}

export function renderOutreachMail(input: OutreachInput) {
  const defaults = defaultsFor(input.template, input.leadName);
  const subject = input.customSubject?.trim() || defaults.subject;
  const bodyRaw = (input.customBody?.trim() || defaults.body).trim();

  const htmlBody = escapeHtml(bodyRaw).replace(/\n/g, "<br>");
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px;font-size:15px;line-height:1.7;color:${COLORS.text};">${htmlBody}</td></tr>
<tr><td style="padding:0 32px 28px 32px;border-top:1px solid ${COLORS.border};padding-top:18px;"><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">Webstability · webstability.eu</p></td></tr>
</table></td></tr></table></body></html>`;

  return { subject, body: bodyRaw, html };
}

export async function sendOutreachMail(input: OutreachInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const { subject, body, html } = renderOutreachMail(input);
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: input.to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(input.to),
    subject,
    text: body,
    html,
  });
}
