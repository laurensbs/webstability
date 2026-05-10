// Mail naar staff (Laurens) zodra een nieuwe klant de intake heeft
// afgerond + welcome-call heeft geboekt. Geen klant-mail — deze is
// puur intern: korte samenvatting van wat de klant heeft ingevuld
// + Cal-tijdstip zodat staff zich kan voorbereiden.

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

const STAFF_NOTIFY_TO = process.env.STAFF_NOTIFY_EMAIL ?? "hello@webstability.eu";

const BUILD_TYPE_LABEL: Record<string, string> = {
  verhuurplatform: "Verhuurplatform",
  reparatie: "Reparatie-portaal",
  webshop: "Website / webshop",
  anders: "Maatwerk-build",
};

export async function sendWelcomeCallStaffNotify({
  orgName,
  ownerName,
  ownerEmail,
  callStartsAt,
  buildType,
  pitch,
  orgId,
}: {
  orgName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  callStartsAt: Date;
  buildType: string;
  pitch: string | null;
  orgId: string;
}): Promise<void> {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM not configured");
  }

  const callFmt = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(callStartsAt);

  const buildLabel = BUILD_TYPE_LABEL[buildType] ?? buildType;
  const adminUrl = `${process.env.AUTH_URL ?? "https://webstability.eu"}/admin/orgs/${orgId}`;
  const subject = `Nieuwe intake afgerond — ${orgName}`;

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
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.wine};">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.wine};">// nieuwe intake</p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.15;color:${COLORS.text};">${escapeHtml(orgName)} <em style="font-style:italic;color:${COLORS.wine};font-weight:300;">heeft intake afgerond.</em></h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.muted};width:130px;">Type build</td>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.text};font-weight:500;">${escapeHtml(buildLabel)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.muted};">Welcome-call</td>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.text};font-weight:500;">${escapeHtml(callFmt)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.muted};">Owner</td>
                    <td style="padding:6px 0;font-size:14px;color:${COLORS.text};">${escapeHtml(ownerName ?? "—")} &lt;${escapeHtml(ownerEmail ?? "—")}&gt;</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              pitch
                ? `<tr>
              <td style="padding:16px 32px 8px 32px;">
                <p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};">Pitch</p>
                <p style="margin:0;font-size:15px;line-height:1.55;color:${COLORS.text};">${escapeHtml(pitch)}</p>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:24px 32px 28px 32px;">
                <a href="${escapeHtml(adminUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:12px 24px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;font-family:inherit;">Open klant-detail →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">tip: open de klant-detail-pagina vóór de call zodat je alle antwoorden bij de hand hebt.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${orgName} heeft intake afgerond.`,
    "",
    `Type build: ${buildLabel}`,
    `Welcome-call: ${callFmt}`,
    `Owner: ${ownerName ?? "—"} <${ownerEmail ?? "—"}>`,
    pitch ? `\nPitch: ${pitch}` : "",
    "",
    `Open klant-detail: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: STAFF_NOTIFY_TO,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html,
  });
}
