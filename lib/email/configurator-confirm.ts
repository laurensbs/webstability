// Bevestigingsmail naar de prospect na een website/webshop-aanvraag via de
// configurator. Recap van de keuzes + de richtprijs-band + "wat gebeurt er nu" +
// een "boek meteen een kennismaking"-link. Plain HTML, inline styles, brand-
// palette — zoals de magic-link/welcome-mails, zodat de eerste mail van
// Webstability al als één gesprek voelt. Faalt graceful (caller vangt 'm).

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
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstability.eu").replace(/\/$/, "");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const eur = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: string;
    eyebrow: string;
    heading: string;
    intro: (kind: string) => string;
    recapTitle: string;
    estimateLabel: string;
    estimateNote: string;
    nextTitle: string;
    nextItems: string[];
    ctaLine: string;
    ctaButton: string;
    signoff: string;
    senderName: string;
    senderRole: string;
    footerTagline: string;
  }
> = {
  nl: {
    subject: "Je aanvraag is binnen — richtprijs + wat er nu gebeurt",
    eyebrow: "// aanvraag ontvangen",
    heading: "Ik heb je aanvraag.",
    intro: (kind) =>
      `Bedankt — je ${kind}-aanvraag via de configurator is binnen. Hieronder je keuzes en de richtprijs nog een keer op een rij, zodat je 'm kunt bewaren.`,
    recapTitle: "Wat je hebt aangevinkt",
    estimateLabel: "Richtprijs",
    estimateNote: "Een schatting (±15%) — de definitieve, vaste offerte volgt na een kort gesprek.",
    nextTitle: "Wat er nu gebeurt",
    nextItems: [
      "Ik kijk je aanvraag door en kom binnen 1 werkdag bij je terug — per mail of telefonisch.",
      "We hebben een korte kennismaking (15–20 min) om de details scherp te krijgen.",
      "Daarna krijg je een vaste offerte en een planning. Geen verrassingen achteraf.",
    ],
    ctaLine: "Liever meteen een moment prikken? Dat kan hier:",
    ctaButton: "Boek een kennismaking",
    signoff: "Tot snel,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    footerTagline: "Eén systeem dat draait — gebouwd en in de lucht gehouden door één persoon.",
  },
  es: {
    subject: "Tu solicitud ha llegado — precio orientativo + próximos pasos",
    eyebrow: "// solicitud recibida",
    heading: "Tengo tu solicitud.",
    intro: (kind) =>
      `Gracias — tu solicitud de ${kind} desde el configurador ha llegado. Abajo tienes tus opciones y el precio orientativo otra vez, para que lo puedas guardar.`,
    recapTitle: "Lo que has marcado",
    estimateLabel: "Precio orientativo",
    estimateNote:
      "Una estimación (±15%) — el presupuesto definitivo y fijo viene tras una breve llamada.",
    nextTitle: "Qué pasa ahora",
    nextItems: [
      "Reviso tu solicitud y te contesto en 1 día laborable — por correo o por teléfono.",
      "Tenemos una breve llamada (15–20 min) para afinar los detalles.",
      "Después recibes un presupuesto fijo y una planificación. Sin sorpresas.",
    ],
    ctaLine: "¿Prefieres reservar un momento ya? Aquí:",
    ctaButton: "Reservar primera llamada",
    signoff: "Hasta pronto,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    footerTagline: "Un sistema que funciona — construido y mantenido por una persona.",
  },
};

export async function sendConfiguratorConfirmMail(input: {
  to: string;
  name: string | null;
  locale?: string;
  kind: "website" | "webshop";
  lowCents: number;
  highCents: number;
  /** Leesbare regels (label + cents) — dezelfde die in de admin-mail staan. */
  lineSummary: Array<{ label: string; cents: number }>;
}): Promise<void> {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const first = (input.name ?? "").split(" ")[0]?.trim() || (locale === "es" ? "hola" : "hoi");
  const kindWord =
    input.kind === "webshop"
      ? locale === "es"
        ? "tienda online"
        : "webshop"
      : locale === "es"
        ? "web"
        : "website";
  const calPath = locale === "es" ? "/es/contacto" : "/contact";

  const rows = input.lineSummary
    .map(
      (l) =>
        `<tr><td style="padding:6px 0;color:${COLORS.muted};font-size:14px">${escapeHtml(l.label)}</td><td style="padding:6px 0;text-align:right;font-size:14px;font-variant-numeric:tabular-nums">${eur(l.cents)}</td></tr>`,
    )
    .join("");

  const nextList = t.nextItems
    .map(
      (s) =>
        `<li style="margin:0 0 8px;color:${COLORS.text};font-size:14px;line-height:1.6">${escapeHtml(s)}</li>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
        <tr><td style="padding:28px 28px 0">
          <p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
          <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(`${t.heading}`)}</h1>
          <p style="margin:0 0 4px;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(`Hoi ${first},`)}</p>
          <p style="margin:8px 0 0;color:${COLORS.muted};font-size:15px;line-height:1.6">${escapeHtml(t.intro(kindWord))}</p>
        </td></tr>
        <tr><td style="padding:20px 28px 0">
          <div style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:12px;padding:16px 18px">
            <p style="margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(t.recapTitle)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            <div style="border-top:1px solid ${COLORS.border};margin-top:10px;padding-top:10px">
              <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(t.estimateLabel)}</p>
              <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:24px;color:${COLORS.text}">${eur(input.lowCents)} – ${eur(input.highCents)}</p>
              <p style="margin:6px 0 0;color:${COLORS.muted};font-size:12px;line-height:1.5">${escapeHtml(t.estimateNote)}</p>
            </div>
          </div>
        </td></tr>
        <tr><td style="padding:20px 28px 0">
          <p style="margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(t.nextTitle)}</p>
          <ol style="margin:0;padding-left:18px">${nextList}</ol>
        </td></tr>
        <tr><td style="padding:20px 28px 28px">
          <p style="margin:0 0 12px;color:${COLORS.muted};font-size:14px;line-height:1.6">${escapeHtml(t.ctaLine)}</p>
          <a href="${SITE_URL}${calPath}" style="display:inline-block;background:${COLORS.accent};color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:999px">${escapeHtml(t.ctaButton)}</a>
          <p style="margin:24px 0 0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.senderName)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
        </td></tr>
        <tr><td style="padding:14px 28px;background:${COLORS.bgWarm};border-top:1px solid ${COLORS.border}">
          <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.5">${escapeHtml(t.footerTagline)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: input.to,
    subject: t.subject,
    html,
    text: `${t.heading}\n\nHoi ${first},\n\n${t.intro(kindWord)}\n\n${t.estimateLabel}: ${eur(input.lowCents)} – ${eur(input.highCents)}\n${t.estimateNote}\n\n${t.nextTitle}:\n${t.nextItems.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n${t.ctaLine}\n${SITE_URL}${calPath}\n\n${t.signoff}\n${t.senderName} — ${t.senderRole}`,
  });
}
