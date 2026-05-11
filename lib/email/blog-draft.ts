// Mail naar Laurens met een vers gegenereerd blog-concept. Verstuurd door
// cron `/api/cron/blog-draft`. Bevat de volledige MDX in een <pre>-blok
// zodat hij 'm kan kopiëren naar `content/blog/nl/[slug].mdx` en committen.
// Geen auto-publish — review blijft bij hem.

import { createTransport } from "nodemailer";

const COLORS = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  codeBg: "#1F1B16",
  codeText: "#EFE8DB",
  text: "#1F1B16",
  muted: "#6B645A",
  accent: "#C9614F",
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
const BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

export type BlogDraftMailInput = {
  slug: string;
  title: string;
  targetKeywords: string;
  bodyMdx: string;
  model: string;
};

export function renderBlogDraftMail(input: BlogDraftMailInput): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = `Blog-concept klaar: ${input.title}`;
  const wordCount = input.bodyMdx.trim().split(/\s+/).length;
  const filePath = `content/blog/nl/${input.slug}.mdx`;

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;">
<p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">// content-engine</p>
<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(input.title)}</h1>
<p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:${COLORS.muted};">Vers concept (~${wordCount} woorden, ${escapeHtml(input.model)}). Zoekwoorden: ${escapeHtml(input.targetKeywords)}.</p>
</td></tr>
<tr><td style="padding:18px 32px 0 32px;">
<p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:${COLORS.text};"><strong>Te doen:</strong> review, eventueel bijschaven, plak de MDX hieronder in <code style="font-family:ui-monospace,monospace;font-size:12px;background:${COLORS.bg};padding:1px 4px;border-radius:3px;">${escapeHtml(filePath)}</code>, run <code style="font-family:ui-monospace,monospace;font-size:12px;background:${COLORS.bg};padding:1px 4px;border-radius:3px;">pnpm build</code> en commit. Daarna eventueel ES-vertaling.</p>
</td></tr>
<tr><td style="padding:18px 32px 8px 32px;"><p style="margin:0 0 8px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(filePath)}</p></td></tr>
<tr><td style="padding:0 32px 28px 32px;">
<pre style="margin:0;padding:18px 20px;background:${COLORS.codeBg};color:${COLORS.codeText};border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;word-break:break-word;overflow-x:auto;">${escapeHtml(input.bodyMdx)}</pre>
</td></tr>
<tr><td style="padding:0 32px 28px 32px;"><a href="${escapeHtml(BASE_URL)}/admin" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:10px 20px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">Open de admin →</a></td></tr>
</table>
</td></tr></table></body></html>`;

  const text = [
    subject,
    "",
    `~${wordCount} woorden — ${input.model}`,
    `Zoekwoorden: ${input.targetKeywords}`,
    "",
    `Plak onderstaande MDX in ${filePath}, run pnpm build, commit.`,
    "",
    "--- MDX ---",
    input.bodyMdx,
  ].join("\n");

  return { html, text, subject };
}

export async function sendBlogDraftMail(input: BlogDraftMailInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const { html, text, subject } = renderBlogDraftMail(input);
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: STAFF_NOTIFY_TO,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html,
  });
}
