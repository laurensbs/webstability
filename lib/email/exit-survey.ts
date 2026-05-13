// "Bedankt — en mag ik je nog iets vragen?" — mail naar de owner van
// een organisatie die net zelf z'n abonnement heeft opgezegd (via de
// Stripe Customer Portal). Eénmalig, persoonlijke toon, zonder pitch
// om 'm terug te halen — alleen: "wat had ik anders moeten doen?".
//
// Geen aparte feedback-form-pagina: de klant antwoordt gewoon op deze
// mail. Voor een one-person studio is dat de menselijkste route en
// houdt 't de codebase klein.
//
// Faalt graceful — caller (webhook) vangt 'm en logt zonder de
// retry-loop in te gaan (mail-fail mag de subscription-update niet
// kapot maken).

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
// Reply-to op MAIL_AUDIT_BCC zodat replies rechtstreeks in Laurens'
// hoofd-inbox landen, ook als EMAIL_FROM een no-reply-style adres is.
const REPLY_TO = process.env.MAIL_AUDIT_BCC ?? null;

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
    thanks: string;
    askIntro: string;
    questions: string[];
    askOutro: string;
    promise: string;
    signoff: string;
    senderName: string;
    senderRole: string;
    footer: string;
  }
> = {
  nl: {
    subject: "Bedankt — en mag ik je één ding vragen?",
    eyebrow: "// even kort",
    heading: "Bedankt voor de tijd dat je klant was.",
    greeting: (f) => `Hoi ${f},`,
    thanks:
      "Ik zag dat je je abonnement hebt opgezegd. Helemaal goed — je toegang loopt netjes door tot het eind van je huidige periode, en daarna sluit alles vanzelf.",
    askIntro: "Mag ik je één ding vragen? Antwoord gerust kort, één regel is genoeg:",
    questions: [
      "Wat had ik beter moeten doen?",
      "Was er één moment waarop het kantelde?",
      "Of: kreeg je gewoon iets anders, niks aan te doen?",
    ],
    askOutro:
      "Geen verkooppraatje, geen onderhandeling om je terug te halen — gewoon zodat ik 't volgende keer beter doe. Antwoord op deze mail; die komt rechtstreeks bij mij binnen.",
    promise:
      "Mocht je ooit nog iets willen — een losse klus, een vraag, een vriend die hulp zoekt — m'n adres blijft hetzelfde.",
    signoff: "Tot ziens,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    footer:
      "Toegang loopt door tot je periode-einde. Daarna kan je oude data nog 30 dagen op aanvraag worden geëxporteerd.",
  },
  es: {
    subject: "Gracias — y ¿te puedo preguntar una cosa?",
    eyebrow: "// un momento",
    heading: "Gracias por el tiempo que has sido cliente.",
    greeting: (f) => `Hola ${f},`,
    thanks:
      "He visto que has cancelado tu suscripción. Sin problema — tu acceso sigue hasta el final del período actual, y después se cierra todo automáticamente.",
    askIntro: "¿Te puedo preguntar una cosa? Responde corto, una línea ya está bien:",
    questions: [
      "¿Qué tendría que haber hecho mejor?",
      "¿Hubo un momento que lo cambió todo?",
      "¿O simplemente encontraste otra cosa, sin más?",
    ],
    askOutro:
      "Nada de venta, nada de negociar para que vuelvas — solo para hacerlo mejor la próxima vez. Responde a este correo; me llega directamente.",
    promise:
      "Si alguna vez quieres algo — un trabajo puntual, una pregunta, un amigo que necesite ayuda — mi dirección sigue siendo la misma.",
    signoff: "Hasta pronto,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    footer:
      "El acceso sigue hasta el final del período. Después, tus datos antiguos se pueden exportar bajo petición durante 30 días.",
  },
};

export async function sendExitSurveyMail(input: {
  to: string;
  name: string | null;
  orgName: string | null;
  locale?: string;
}): Promise<void> {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const first = (input.name ?? "").split(" ")[0]?.trim() || (locale === "es" ? "hola" : "hoi");

  const questionList = t.questions
    .map(
      (q) =>
        `<li style="margin:0 0 8px;color:${COLORS.text};font-size:14.5px;line-height:1.6">${escapeHtml(q)}</li>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
        <tr><td style="border-top:2px solid ${COLORS.wine};padding:28px 28px 8px">
          <p style="margin:0 0 14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(t.heading)}</h1>
          <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.65">${escapeHtml(t.greeting(first))}</p>
          <p style="margin:0 0 12px;color:${COLORS.muted};font-size:15px;line-height:1.65">${escapeHtml(t.thanks)}</p>
          <p style="margin:0 0 8px;color:${COLORS.text};font-size:14.5px;line-height:1.65">${escapeHtml(t.askIntro)}</p>
          <ul style="margin:0 0 14px;padding-left:18px">${questionList}</ul>
          <p style="margin:0 0 14px;color:${COLORS.muted};font-size:14px;line-height:1.65">${escapeHtml(t.askOutro)}</p>
          <p style="margin:0 0 0;color:${COLORS.muted};font-size:14px;line-height:1.6">${escapeHtml(t.promise)}</p>
        </td></tr>
        <tr><td style="padding:18px 28px 24px">
          <p style="margin:0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.senderName)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
        </td></tr>
        <tr><td style="padding:14px 28px;background:${COLORS.bgWarm};border-top:1px solid ${COLORS.border}">
          <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.55">${escapeHtml(t.footer)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    t.heading,
    "",
    t.greeting(first),
    "",
    t.thanks,
    "",
    t.askIntro,
    ...t.questions.map((q) => `  - ${q}`),
    "",
    t.askOutro,
    "",
    t.promise,
    "",
    t.signoff,
    `${t.senderName} — ${t.senderRole}`,
    "",
    t.footer,
  ].join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: input.to,
    bcc: auditBcc(input.to),
    replyTo: REPLY_TO ?? undefined,
    subject: t.subject,
    html,
    text,
    headers: input.orgName ? { "X-WS-Org": input.orgName } : undefined,
  });
}
