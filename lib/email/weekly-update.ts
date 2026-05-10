// Wekelijkse update-mail naar klanten met een actieve build-fase. Bundelt
// alle staff-updates van de afgelopen 7 dagen in één rustige cream-mail.
// Verstuurd door cron `/api/cron/weekly-update` elke woensdag 09:00.

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

const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

export type WeeklyUpdateInput = {
  to: string;
  ownerName: string | null;
  projectName: string;
  weekIndex: number;
  totalWeeks: number;
  updates: Array<{ body: string; postedAt: Date; postedBy: string | null }>;
  hoursThisWeek: number; // minuten
  nextMilestone: string | null;
  portalUrl: string;
};

export async function sendWeeklyUpdateMail({
  to,
  ownerName,
  projectName,
  weekIndex,
  totalWeeks,
  updates,
  hoursThisWeek,
  nextMilestone,
  portalUrl,
}: WeeklyUpdateInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");

  const firstName = (ownerName ?? "").split(" ")[0]?.trim() || "vriend";
  const subject = `Stand van zaken — ${projectName} (week ${weekIndex}/${totalWeeks})`;
  const hoursLabel =
    hoursThisWeek === 0
      ? "geen logbare uren deze week"
      : `${(hoursThisWeek / 60).toFixed(1)}u gewerkt deze week`;

  const updatesHtml =
    updates.length === 0
      ? `<p style="margin:0;font-size:14px;color:${COLORS.muted};font-style:italic;">Geen specifieke updates deze week — werk loopt door op de achtergrond.</p>`
      : updates
          .map((u) => {
            const dateFmt = new Intl.DateTimeFormat("nl-NL", {
              day: "numeric",
              month: "short",
            }).format(u.postedAt);
            return `<tr><td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};"><p style="margin:0 0 4px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.08em;color:${COLORS.muted};text-transform:uppercase;">${escapeHtml(dateFmt)}${u.postedBy ? ` · ${escapeHtml(u.postedBy)}` : ""}</p><p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.text};white-space:pre-wrap;">${escapeHtml(u.body)}</p></td></tr>`;
          })
          .join("");

  const html = `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.wine};">
<tr><td style="padding:28px 32px 0 32px;"><p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.wine};">// week ${weekIndex} van ${totalWeeks}</p><h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:${COLORS.text};">${escapeHtml(projectName)}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};">Hoi ${escapeHtml(firstName)} — een korte stand-van-zaken.</p></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0 0 8px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">Wat ik deed</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.border};">${updatesHtml}</table></td></tr>
${
  nextMilestone
    ? `<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0 0 8px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.wine};">Volgende mijlpaal</p><p style="margin:0;font-size:14px;line-height:1.55;color:${COLORS.text};">${escapeHtml(nextMilestone)}</p></td></tr>`
    : ""
}
<tr><td style="padding:18px 32px 8px 32px;"><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">${escapeHtml(hoursLabel)}</p></td></tr>
<tr><td style="padding:14px 32px 28px 32px;"><a href="${escapeHtml(portalUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:11px 22px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">Open in portaal →</a></td></tr>
<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${COLORS.text};">Tot volgende week,</p><p style="margin:0;font-size:13px;color:${COLORS.text};font-weight:500;">Laurens Bos</p><p style="margin:0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">Founder · Webstability</p></td></tr>
</table></td></tr></table></body></html>`;

  const textParts: string[] = [
    `${projectName} — week ${weekIndex} van ${totalWeeks}`,
    "",
    `Hoi ${firstName},`,
    "",
    "Wat ik deed:",
  ];
  if (updates.length === 0) {
    textParts.push("- Geen specifieke updates deze week.");
  } else {
    for (const u of updates) {
      const d = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(
        u.postedAt,
      );
      textParts.push(`- [${d}] ${u.body}`);
    }
  }
  if (nextMilestone) {
    textParts.push("", "Volgende mijlpaal:", nextMilestone);
  }
  textParts.push("", hoursLabel, "", `Open in portaal: ${portalUrl}`);

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM,
    bcc: auditBcc(to),
    subject,
    text: textParts.join("\n"),
    html,
  });
}
