// Branded staff-invite email — sent when an existing staff member
// invites a new one via /admin/team. Cream + terracotta + wijn-rode
// accent voor de "studio invite"-vibe. De ontvanger klikt zelf op
// "log in" → magic-link → bij eerste signIn promote'n we hem tot staff
// op basis van email-match.

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

/**
 * Send a staff-invite email. The invitee gets a link to /login;
 * after their first magic-link auth, lib/auth.ts promotes them
 * to isStaff=true via promoteUserIfInvited().
 */
export async function sendStaffInvite({
  to,
  inviterName,
  inviterEmail,
}: {
  to: string;
  inviterName: string | null;
  inviterEmail: string | null;
}) {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM not configured");
  }

  const inviter = inviterName?.trim() || inviterEmail || "een collega";
  const subject = "Welkom in de Webstability studio";
  const loginUrl = `${process.env.AUTH_URL ?? "https://admin.webstability.eu"}/nl/login`;

  const html = `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="border-top:2px solid ${COLORS.wine};padding:28px 32px 0 32px;">
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
                  // studio invite
                </p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;letter-spacing:-0.01em;color:${COLORS.text};">
                  ${escapeHtml(inviter)} heeft je <em style="font-style:italic;color:${COLORS.accent};font-weight:300;">uitgenodigd</em>.
                </h1>
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">
                  Je bent toegevoegd als studio-staff bij Webstability. Klik op
                  de knop hieronder om in te loggen — bij je eerste login krijg je
                  automatisch toegang tot het admin paneel.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${COLORS.text};border-radius:999px;">
                      <a href="${escapeHtml(loginUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;font-family:inherit;">
                        Log in op admin.webstability.eu →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.55;color:${COLORS.muted};">
                  Deze invite is 7 dagen geldig. Niet verwacht? Negeer deze mail —
                  zonder klik gebeurt er niets.
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
    `${inviter} heeft je uitgenodigd om studio-staff te worden bij Webstability.`,
    "",
    `Log in via: ${loginUrl}`,
    "",
    "Deze invite is 7 dagen geldig.",
  ].join("\n");

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
