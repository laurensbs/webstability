// Livegang-mail naar de klant wanneer staff een project markeert als
// 'live'. Premium feel: cream + wijn-rode accent (CheckCircle), korte
// felicitatie + link naar portal én naar de live URL.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  bgWarm: "#EFE8DB",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
  accentSoft: "#F4DCD4",
  wine: "#6B1E2C",
  success: "#5A7A4A",
};

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: (project: string) => string;
    preheader: string;
    eyebrow: string;
    headingLive: string;
    intro: (project: string) => string;
    visitButton: string;
    portalButton: string;
    signoff: string;
    senderName: string;
    senderRole: string;
  }
> = {
  nl: {
    subject: (p) => `${p} is live`,
    preheader: "Je portaal staat live. Tijd voor een rondje.",
    eyebrow: "// livegang",
    headingLive: "Live.",
    intro: (p) =>
      `${p} draait. Vanaf nu zien klanten je nieuwe site, kun je direct boekingen of contactaanvragen ontvangen, en houden we monitoring + uptime in de gaten.`,
    visitButton: "Open de live site",
    portalButton: "Bekijk in je portaal",
    signoff: "Veel succes,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
  },
  es: {
    subject: (p) => `${p} está en vivo`,
    preheader: "Tu portal está en vivo. Hora de echar un vistazo.",
    eyebrow: "// lanzamiento",
    headingLive: "En vivo.",
    intro: (p) =>
      `${p} está funcionando. Desde ahora los clientes ven tu nuevo site, puedes recibir reservas o consultas directamente, y nosotros vigilamos monitoring + uptime.`,
    visitButton: "Abre el sitio en vivo",
    portalButton: "Ver en tu portal",
    signoff: "¡Mucho éxito,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
  },
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

export async function sendLivegangMail({
  to,
  name,
  projectName,
  projectUrl,
  locale = "nl",
}: {
  to: string;
  name: string | null;
  projectName: string;
  projectUrl: string | null;
  locale?: Locale;
}) {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM not configured");
  }

  const t = COPY[locale];
  const firstName = (name ?? "").split(" ")[0]?.trim() || (locale === "es" ? "amigo" : "vriend");
  const portalUrl = `${process.env.AUTH_URL ?? "https://webstability.eu"}/${locale}/portal/dashboard`;
  const subject = t.subject(projectName);

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
    <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(t.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.wine};">

            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:8px;line-height:0;">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1.5" y="1.5" width="21" height="21" rx="5" stroke="${COLORS.text}" stroke-width="1.5"/>
                        <path d="M 6 8 L 9 16 L 12 10" stroke="${COLORS.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M 12 10 L 15 16 L 18 8" stroke="${COLORS.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </td>
                    <td style="font-weight:800;font-size:18px;letter-spacing:-0.02em;color:${COLORS.text};">
                      webstability<span style="color:${COLORS.accent};">.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.wine};">
                  ${escapeHtml(t.eyebrow)}
                </p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:36px;line-height:1.1;letter-spacing:-0.01em;color:${COLORS.text};">
                  ${escapeHtml(projectName)} <em style="font-style:italic;color:${COLORS.wine};font-weight:300;">${escapeHtml(t.headingLive)}</em>
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">
                  ${escapeHtml(`${firstName}, `)}${escapeHtml(t.intro(projectName))}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  ${
                    projectUrl
                      ? `<tr>
                          <td style="background:${COLORS.text};border-radius:999px;padding-right:8px;">
                            <a href="${escapeHtml(projectUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;font-family:inherit;">
                              ${escapeHtml(t.visitButton)} →
                            </a>
                          </td>
                          <td style="width:8px;"></td>
                          <td>
                            <a href="${escapeHtml(portalUrl)}" target="_blank" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:500;color:${COLORS.text};text-decoration:none;font-family:inherit;border:1px solid ${COLORS.border};border-radius:999px;">
                              ${escapeHtml(t.portalButton)}
                            </a>
                          </td>
                        </tr>`
                      : `<tr>
                          <td style="background:${COLORS.text};border-radius:999px;">
                            <a href="${escapeHtml(portalUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;font-family:inherit;">
                              ${escapeHtml(t.portalButton)} →
                            </a>
                          </td>
                        </tr>`
                  }
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:${COLORS.text};">
                  ${escapeHtml(t.signoff)}
                </p>
                <p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">
                  ${escapeHtml(t.senderName)}
                </p>
                <p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">
                  ${escapeHtml(t.senderRole)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${projectName} ${t.headingLive}`,
    "",
    t.intro(projectName),
    "",
    projectUrl ? `${t.visitButton}: ${projectUrl}` : "",
    `${t.portalButton}: ${portalUrl}`,
    "",
    t.signoff,
    t.senderName,
    t.senderRole,
  ]
    .filter(Boolean)
    .join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(to),
    subject,
    text,
    html,
  });
}
