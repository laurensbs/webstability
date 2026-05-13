// Mail-notify voor ticket-replies. Twee richtingen:
//   - sendTicketReplyToClient(): staff antwoordt → klant krijgt mail
//   - sendTicketReplyToStaff():   klant antwoordt → staff krijgt mail
// Geen interne staff-notities mailen (die hoort de klant nooit te zien).
// Faalt graceful — caller logt de error, maar de reply is dan al opgeslagen.
// NL+ES voor de klant-mail; staff-mail is NL-only (intern).

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
const STAFF_NOTIFY_EMAIL = process.env.STAFF_NOTIFY_EMAIL ?? MAIL_AUDIT_BCC;

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

function snippet(s: string, max = 280): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + "…";
}

type Locale = "nl" | "es";

// ---- Staff → klant ---------------------------------------------------------

const CLIENT_COPY: Record<
  Locale,
  {
    subject: (s: string) => string;
    eyebrow: string;
    heading: string;
    intro: (name: string, ticketSubject: string) => string;
    bodyLabel: string;
    cta: string;
    closeBody: string;
    signoff: string;
    senderName: string;
    senderRole: string;
    hi: string;
  }
> = {
  nl: {
    subject: (s) => `Re: ${s}`,
    eyebrow: "// ticket-update",
    heading: "Nieuw bericht.",
    intro: (name, s) =>
      `Hoi ${name}, ik heb gereageerd op je ticket "${s}". Hieronder kort wat ik schreef — klik door naar je portaal voor de volledige draad.`,
    bodyLabel: "Mijn bericht",
    cta: "Open ticket in portaal",
    closeBody:
      "Antwoorden gaat het makkelijkst via je portaal — dan blijft alles op één plek bewaard.",
    signoff: "Tot snel,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    hi: "vriend",
  },
  es: {
    subject: (s) => `Re: ${s}`,
    eyebrow: "// actualización de ticket",
    heading: "Nuevo mensaje.",
    intro: (name, s) =>
      `Hola ${name}, he respondido a tu ticket "${s}". Abajo un resumen de lo que escribí — pulsa para ver el hilo completo en tu portal.`,
    bodyLabel: "Mi mensaje",
    cta: "Abrir ticket en el portal",
    closeBody: "Responder es más fácil desde tu portal — así todo queda en un solo sitio.",
    signoff: "Hasta pronto,",
    senderName: "Laurens Bos",
    senderRole: "Webstability",
    hi: "amigo",
  },
};

export async function sendTicketReplyToClient(input: {
  to: string;
  clientName: string | null;
  ticketSubject: string;
  ticketId: string;
  bodySnippet: string;
  locale?: Locale;
}): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");

  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = CLIENT_COPY[locale];
  const first = (input.clientName ?? "").split(" ")[0]?.trim() || t.hi;
  const baseUrl = (process.env.AUTH_URL ?? "https://webstability.eu").replace(/\/$/, "");
  const portalUrl = `${baseUrl}/${locale === "es" ? "es/" : ""}portal/tickets/${input.ticketId}`;
  const subject = t.subject(input.ticketSubject);
  const body = snippet(input.bodySnippet);

  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden;border-top:2px solid ${COLORS.wine}">
      <tr><td style="padding:28px 30px 0">
        <p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(t.heading)}</h1>
        <p style="margin:8px 0 0;color:${COLORS.muted};font-size:15px;line-height:1.6">${escapeHtml(t.intro(first, input.ticketSubject))}</p>
      </td></tr>
      <tr><td style="padding:20px 30px 0">
        <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.12em;color:${COLORS.muted};text-transform:uppercase">${escapeHtml(t.bodyLabel)}</p>
        <div style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px 16px">
          <p style="margin:0;font-size:14px;line-height:1.55;color:${COLORS.text};white-space:pre-wrap">${escapeHtml(body)}</p>
        </div>
      </td></tr>
      <tr><td style="padding:20px 30px 0">
        <a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:${COLORS.text};color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:999px">${escapeHtml(t.cta)} →</a>
      </td></tr>
      <tr><td style="padding:16px 30px 26px">
        <p style="margin:0;color:${COLORS.muted};font-size:13px;line-height:1.55">${escapeHtml(t.closeBody)}</p>
        <p style="margin:18px 0 0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.senderName)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text = `${t.heading}\n\n${t.intro(first, input.ticketSubject)}\n\n${t.bodyLabel}:\n${body}\n\n${t.cta}: ${portalUrl}\n\n${t.closeBody}\n\n${t.signoff}\n${t.senderName} — ${t.senderRole}`;

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: input.to,
    bcc: auditBcc(input.to),
    subject,
    html,
    text,
  });
}

// ---- Klant → staff (intern, NL-only) ---------------------------------------

export async function sendTicketReplyToStaff(input: {
  ticketSubject: string;
  ticketId: string;
  clientName: string | null;
  clientEmail: string;
  orgName: string;
  bodySnippet: string;
}): Promise<void> {
  if (!process.env.EMAIL_FROM || !STAFF_NOTIFY_EMAIL) return;

  const baseUrl = (process.env.AUTH_URL ?? "https://webstability.eu").replace(/\/$/, "");
  const adminUrl = `${baseUrl}/admin/tickets/${input.ticketId}`;
  const subject = `Reply van ${input.clientName ?? input.clientEmail} — ${input.ticketSubject}`;
  const body = snippet(input.bodySnippet);

  const html = `<!doctype html><html lang="nl"><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent}">
      <tr><td style="padding:24px 28px">
        <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent}">// reply binnen</p>
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:400;font-size:22px;line-height:1.3;color:${COLORS.text}">${escapeHtml(input.ticketSubject)}</h1>
        <p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;color:${COLORS.muted}">${escapeHtml(input.clientName ?? input.clientEmail)} · ${escapeHtml(input.orgName)}</p>
      </td></tr>
      <tr><td style="padding:0 28px 16px">
        <div style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:10px;padding:14px 16px">
          <p style="margin:0;font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(body)}</p>
        </div>
      </td></tr>
      <tr><td style="padding:0 28px 24px">
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:${COLORS.text};color:#fff;text-decoration:none;font-size:13px;font-weight:500;padding:9px 18px;border-radius:999px">Open in admin →</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text = `Reply van ${input.clientName ?? input.clientEmail} (${input.orgName})\n\nTicket: ${input.ticketSubject}\n\n${body}\n\nOpen in admin: ${adminUrl}`;

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: STAFF_NOTIFY_EMAIL,
    subject,
    html,
    text,
  });
}
