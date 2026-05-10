// Korte staff-notify mail wanneer een klant een deliverable goedkeurt.
// Niet bedoeld voor klant — pure interne notificatie zodat staff
// weet dat een nieuwe versie kan worden uitgerold (of het traject
// een stap verder is). Cream + wijn-rode top, klein.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
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

const STAFF_NOTIFY_TO = process.env.STAFF_NOTIFY_EMAIL ?? "hello@webstability.eu";

export async function sendDeliverableApprovedNotify({
  fileName,
  projectName,
  approvedBy,
  orgId,
}: {
  fileName: string;
  projectName: string | null;
  approvedBy: string;
  orgId: string;
}): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const adminUrl = `${process.env.AUTH_URL ?? "https://webstability.eu"}/admin/orgs/${orgId}`;
  const subject = `Akkoord: ${fileName}${projectName ? ` (${projectName})` : ""}`;

  const html = `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.success};">
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 8px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.success};">// akkoord ontvangen</p>
<h1 style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;line-height:1.25;color:${COLORS.text};">${escapeHtml(fileName)}</h1>
<p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;color:${COLORS.muted};">${escapeHtml(approvedBy)} heeft akkoord gegeven${projectName ? ` op ${escapeHtml(projectName)}` : ""}.</p>
<a href="${escapeHtml(adminUrl)}" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:10px 20px;font-size:13px;font-weight:500;text-decoration:none;border-radius:999px;">Open klant-detail →</a>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `${approvedBy} heeft akkoord gegeven op ${fileName}${projectName ? ` (${projectName})` : ""}.`,
    "",
    `Open klant-detail: ${adminUrl}`,
  ].join("\n");

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: STAFF_NOTIFY_TO,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html,
  });
}
