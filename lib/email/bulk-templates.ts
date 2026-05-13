import { createTransport } from "nodemailer";

/**
 * Bulk-mail templates voor `bulkMailOrgs` server-action. Drie varianten:
 * korte update, factuur-herinnering, kwartaal-rapport. Hetzelfde
 * studio-stem-frame als livegang.ts (cream + wijn-rode top-border) zodat
 * elke uitgaande mail visueel consistent is.
 *
 * Strategie: bulk-mail is een tijdsbesparende tool, niet een
 * marketing-campagne. Houd content kort, persoonlijke data minimaal,
 * één duidelijke CTA per template.
 *
 * NL + ES — per-recipient locale (uit users.locale).
 */

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

export type BulkTemplateId = "short_update" | "invoice_reminder" | "quarterly_report";
type Locale = "nl" | "es";

type TemplateCopy = {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

const TEMPLATES: Record<Locale, Record<BulkTemplateId, TemplateCopy>> = {
  nl: {
    short_update: {
      subject: "Even bijgepraat",
      preheader: "Een snelle stand-van-zaken voor je portaal en abonnement.",
      eyebrow: "// korte update",
      heading: "Even bijgepraat.",
      body: "Een snelle stand-van-zaken: je portaal draait, monitoring stabiel, geen openstaande punten van mijn kant. Mocht er iets zijn waar je vragen over hebt, mail terug — ik antwoord binnen één werkdag.",
      ctaLabel: "Open je portaal",
      ctaUrl: "https://webstability.eu/portal/dashboard",
    },
    invoice_reminder: {
      subject: "Klein geheugensteuntje — er staat een factuur open",
      preheader: "Er staat nog een factuur open in je portaal.",
      eyebrow: "// factuur",
      heading: "Klein geheugensteuntje.",
      body: "Er staat nog een factuur open in je portaal. Geen druk — als er iets onduidelijk is, mail terug. Anders kun je 'm via je portaal direct betalen.",
      ctaLabel: "Bekijk factuur",
      ctaUrl: "https://webstability.eu/portal/invoices",
    },
    quarterly_report: {
      subject: "Je kwartaal-rapport staat klaar",
      preheader: "Wat er is gebeurd, wat er volgend kwartaal komt.",
      eyebrow: "// kwartaal-rapport",
      heading: "Drie maanden samengevat.",
      body: "Het kwartaal-rapport voor je portaal staat klaar — wat er is gebeurd, hoeveel uur er is besteed, en wat de planning is voor het volgend kwartaal. Bekijk 'm in je portaal.",
      ctaLabel: "Open rapport",
      ctaUrl: "https://webstability.eu/portal/dashboard",
    },
  },
  es: {
    short_update: {
      subject: "Un breve avance",
      preheader: "Un estado rápido de tu portal y suscripción.",
      eyebrow: "// breve avance",
      heading: "Un breve avance.",
      body: "Un estado rápido: tu portal funciona, la monitorización estable, sin puntos pendientes por mi parte. Si tienes alguna pregunta, responde a este correo — contesto en un día laborable.",
      ctaLabel: "Abrir tu portal",
      ctaUrl: "https://webstability.eu/es/portal/dashboard",
    },
    invoice_reminder: {
      subject: "Pequeño recordatorio — hay una factura abierta",
      preheader: "Tienes una factura pendiente en tu portal.",
      eyebrow: "// factura",
      heading: "Pequeño recordatorio.",
      body: "Tienes una factura pendiente en tu portal. Sin prisa — si algo no queda claro, responde a este correo. Si no, puedes pagarla directamente desde el portal.",
      ctaLabel: "Ver factura",
      ctaUrl: "https://webstability.eu/es/portal/invoices",
    },
    quarterly_report: {
      subject: "Tu informe trimestral está listo",
      preheader: "Lo que ha pasado y lo que viene el próximo trimestre.",
      eyebrow: "// informe trimestral",
      heading: "Tres meses en resumen.",
      body: "El informe trimestral de tu portal está listo — lo que ha pasado, cuántas horas se han dedicado, y la planificación para el próximo trimestre. Míralo en tu portal.",
      ctaLabel: "Abrir informe",
      ctaUrl: "https://webstability.eu/es/portal/dashboard",
    },
  },
};

const GREETING: Record<Locale, (first: string) => string> = {
  nl: (f) => `Hoi ${f},`,
  es: (f) => `Hola ${f},`,
};

const SIGNOFF: Record<Locale, { line: string; role: string; fallbackFirst: string }> = {
  nl: { line: "Hartelijke groet,", role: "Founder · Webstability", fallbackFirst: "vriend" },
  es: { line: "Un saludo,", role: "Founder · Webstability", fallbackFirst: "amigo" },
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

export async function sendBulkMail({
  to,
  recipientName,
  template,
  locale: localeInput,
}: {
  to: string;
  recipientName: string | null;
  template: BulkTemplateId;
  locale?: string;
}) {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM not configured");
  }

  const locale: Locale = localeInput === "es" ? "es" : "nl";
  const t = TEMPLATES[locale][template];
  const sign = SIGNOFF[locale];
  const greet = GREETING[locale];
  const firstName = (recipientName ?? "").split(" ")[0]?.trim() || sign.fallbackFirst;

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(t.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
    <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all;">${escapeHtml(t.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.wine};">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <p style="margin:0;font-weight:800;font-size:18px;letter-spacing:-0.02em;color:${COLORS.text};">
                  webstability<span style="color:${COLORS.accent};">.</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.wine};">${escapeHtml(t.eyebrow)}</p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:32px;line-height:1.1;color:${COLORS.text};">${escapeHtml(t.heading)}</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(greet(firstName))}</p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(t.body)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <a href="${escapeHtml(t.ctaUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:13px 28px;font-size:15px;font-weight:500;text-decoration:none;border-radius:999px;font-family:inherit;">${escapeHtml(t.ctaLabel)} →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${COLORS.text};">${escapeHtml(sign.line)}</p>
                <p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">Laurens Bos</p>
                <p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(sign.role)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    t.heading,
    "",
    greet(firstName),
    "",
    t.body,
    "",
    `${t.ctaLabel}: ${t.ctaUrl}`,
    "",
    sign.line,
    "Laurens Bos",
    sign.role,
  ].join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(to),
    subject: t.subject,
    text,
    html,
  });
}
