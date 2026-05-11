// Branded welcome email — sent once when a new user lands in the portal
// for the first time. Mirrors the magic-link template's structure
// (cream + terracotta palette, inline LogoMark, pill button) so the
// two messages feel like one conversation.
//
// Twee triggers:
//  1. Auth.js `createUser` event (lib/auth.ts) — als de adapter zelf
//     een user-rij maakt (eerste magic-link-klik voor een nieuw adres).
//  2. De anon-checkout-done-handler (app/[locale]/checkout/done) maakt
//     de user direct via Drizzle aan, zónder de adapter — daar fire't
//     het event niet, dus die roept `sendWelcomeEmail` expliciet aan.

import { createTransport } from "nodemailer";

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

function welcomeAuditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

/**
 * Verstuurt de welkom-mail. Faalt graceful — een flaky SMTP-delivery
 * mag de checkout-flow of de login niet blokkeren. Caller hoort dit
 * in een try/catch te wikkelen of het resultaat te negeren.
 */
export async function sendWelcomeEmail({
  to,
  name,
  portalUrl,
  locale = "nl",
}: {
  to: string;
  name: string | null;
  portalUrl: string;
  locale?: "nl" | "es";
}): Promise<void> {
  if (!process.env.EMAIL_FROM) return;
  const { subject, html, text } = renderWelcomeEmail({ name, portalUrl, locale });
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM,
    bcc: welcomeAuditBcc(to),
    subject,
    text,
    html,
  });
}

const COLORS = {
  bg: "#F5F0E8",
  bgWarm: "#EFE8DB",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
  accentSoft: "#F4DCD4",
  success: "#5A7A4A",
};

type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    preheader: string;
    eyebrow: string;
    headingPrefix: string;
    headingSuffix: string;
    intro: string;
    bullets: string[];
    button: string;
    notReady: string;
    notReadyBody: string;
    signoff: string;
    senderName: string;
    senderRole: string;
    footerSystems: string;
    footerTagline: string;
  }
> = {
  nl: {
    preheader: "Welkom in je Webstability-portaal.",
    eyebrow: "// klantportaal",
    headingPrefix: "Welkom,",
    headingSuffix: ".",
    intro:
      "Je portaal staat klaar. Hierbinnen volg je je projecten, krijg je facturen, deel je bestanden en zie je live de status van je site — allemaal vanuit één plek.",
    bullets: [
      "Live status van je site en services",
      "Projectvoortgang en wekelijkse updates",
      "Tickets en bestanden delen direct met mij",
      "Facturen en abonnementsbeheer",
    ],
    button: "Open je portal",
    notReady: "Nog geen account?",
    notReadyBody:
      "Geen probleem — je krijgt deze mail omdat je net hebt ingelogd. Geen accountmanagers, geen verkooppraat. Reageer gewoon op deze mail als er iets is.",
    signoff: "Tot snel,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
    footerSystems: "alle systemen draaien",
    footerTagline: "Eén ontwikkelaar. Software die blijft werken.",
  },
  es: {
    preheader: "Bienvenido a tu portal de Webstability.",
    eyebrow: "// portal cliente",
    headingPrefix: "Bienvenido,",
    headingSuffix: ".",
    intro:
      "Tu portal está listo. Aquí dentro sigues tus proyectos, recibes facturas, compartes archivos y ves el estado de tu site en vivo — todo desde un solo lugar.",
    bullets: [
      "Estado en vivo de tu site y servicios",
      "Progreso de proyectos y novedades semanales",
      "Compartir tickets y archivos conmigo",
      "Facturas y gestión de la suscripción",
    ],
    button: "Abrir tu portal",
    notReady: "¿Aún no tienes cuenta?",
    notReadyBody:
      "Sin problema — recibes este correo porque acabas de entrar. Sin gestores, sin presentaciones comerciales. Responde a este email si necesitas algo.",
    signoff: "Hasta pronto,",
    senderName: "Laurens Bos",
    senderRole: "Founder · Webstability",
    footerSystems: "todo en línea",
    footerTagline: "Un solo desarrollador. Software que sigue funcionando.",
  },
};

export function renderWelcomeEmail({
  name,
  portalUrl,
  locale = "nl",
}: {
  name: string | null;
  portalUrl: string;
  locale?: Locale;
}) {
  const t = COPY[locale];
  const firstName = (name ?? "").split(" ")[0]?.trim() || null;
  const subject = locale === "es" ? "Bienvenido a Webstability" : "Welkom bij Webstability";

  const headingName = firstName ?? (locale === "es" ? "amigo" : "vriend");

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
    <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(t.preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">

            <!-- Header strip with logo -->
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

            <!-- Body -->
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <p style="margin:0 0 12px 0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">
                  ${escapeHtml(t.eyebrow)}
                </p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;letter-spacing:-0.01em;color:${COLORS.text};">
                  ${escapeHtml(t.headingPrefix)} <em style="font-style:italic;color:${COLORS.accent};font-weight:300;">${escapeHtml(headingName)}</em>${escapeHtml(t.headingSuffix)}
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">
                  ${escapeHtml(t.intro)}
                </p>
              </td>
            </tr>

            <!-- Bullet list -->
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${t.bullets
                    .map(
                      (b) => `
                  <tr>
                    <td valign="top" style="padding:6px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="top" style="padding-right:12px;line-height:1;">
                            <span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${COLORS.accentSoft};color:${COLORS.accent};text-align:center;font-size:12px;line-height:18px;font-weight:600;">✓</span>
                          </td>
                          <td valign="top" style="font-size:14px;line-height:1.5;color:${COLORS.text};">
                            ${escapeHtml(b)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`,
                    )
                    .join("")}
                </table>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${COLORS.text};border-radius:999px;">
                      <a href="${escapeAttr(portalUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;font-family:inherit;">
                        ${escapeHtml(t.button)} →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 32px;">
                <div style="height:1px;background:${COLORS.border};"></div>
              </td>
            </tr>

            <!-- Personal note -->
            <tr>
              <td style="padding:24px 32px 28px 32px;">
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:500;color:${COLORS.text};">
                  ${escapeHtml(t.notReady)}
                </p>
                <p style="margin:0 0 18px 0;font-size:13px;line-height:1.55;color:${COLORS.muted};">
                  ${escapeHtml(t.notReadyBody)}
                </p>
                <p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:${COLORS.text};">
                  ${escapeHtml(t.signoff)}
                </p>
                <p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">
                  ${escapeHtml(t.senderName)}
                </p>
                <p style="margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">
                  ${escapeHtml(t.senderRole)}
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin-top:24px;">
            <tr>
              <td align="center" style="padding:0 16px;">
                <p style="margin:0 0 12px 0;font-size:12px;color:${COLORS.muted};">
                  ${escapeHtml(t.footerTagline)}
                </p>
                <p style="margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">
                  <span style="display:inline-block;width:6px;height:6px;background:${COLORS.success};border-radius:50%;vertical-align:middle;margin-right:6px;"></span>
                  ${escapeHtml(t.footerSystems)}
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
    `${t.headingPrefix} ${headingName}${t.headingSuffix}`,
    "",
    t.intro,
    "",
    ...t.bullets.map((b) => `• ${b}`),
    "",
    `${t.button}: ${portalUrl}`,
    "",
    `${t.notReady} ${t.notReadyBody}`,
    "",
    `${t.signoff}`,
    t.senderName,
    t.senderRole,
    "",
    "— webstability.eu",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
