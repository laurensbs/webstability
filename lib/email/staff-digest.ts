// Dagelijkse "wat staat er voor jou klaar"-mail naar Laurens. Bundelt
// alles waar actie op nodig is — leads om op te volgen, aankomende
// calls, ingevulde intakes, projecten in review, high-priority tickets,
// stale build-projecten — zodat hij 's ochtends één mail checkt i.p.v.
// vijf admin-widgets. Verstuurd door cron `/api/cron/daily-digest`.

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
const ADMIN_BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

export type DailyDigestInput = {
  leads: Array<{
    name: string | null;
    email: string;
    company: string | null;
    status: string;
    nextActionLabel: string | null;
    nextActionAt: Date | null;
  }>;
  upcomingCalls: Array<{
    type: string;
    startsAt: Date;
    attendeeName: string | null;
    orgName: string;
  }>;
  submittedIntakes: Array<{ orgName: string; submittedAt: Date | null }>;
  projectsInReview: Array<{ name: string; orgName: string }>;
  highPriorityTickets: Array<{ subject: string; orgName: string }>;
  staleProjects: Array<{ projectName: string; orgName: string }>;
};

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function section(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0 0 8px 0;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(title)}</p><ul style="margin:0;padding-left:18px;">${items
    .map(
      (i) =>
        `<li style="margin:0 0 5px 0;font-size:14px;line-height:1.5;color:${COLORS.text};">${i}</li>`,
    )
    .join("")}</ul></td></tr>`;
}

export function renderDailyDigest(input: DailyDigestInput): {
  html: string;
  text: string;
  subject: string;
} {
  const today = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const total =
    input.leads.length +
    input.upcomingCalls.length +
    input.submittedIntakes.length +
    input.projectsInReview.length +
    input.highPriorityTickets.length +
    input.staleProjects.length;
  const subject = `Vandaag voor jou — ${total} ${total === 1 ? "ding" : "dingen"} (${today})`;

  const leadItems = input.leads.map(
    (l) =>
      `<strong>${escapeHtml(l.name ?? l.email)}</strong>${l.company ? ` · ${escapeHtml(l.company)}` : ""} — ${escapeHtml(l.nextActionLabel ?? "opvolgen")} <span style="color:${COLORS.muted};">(${escapeHtml(l.status)}, ${fmtDate(l.nextActionAt)})</span>`,
  );
  const callItems = input.upcomingCalls.map(
    (c) =>
      `<strong>${escapeHtml(c.orgName)}</strong> — ${escapeHtml(c.type.replace(/_/g, " "))} op ${fmtDate(c.startsAt)}${c.attendeeName ? ` (${escapeHtml(c.attendeeName)})` : ""}`,
  );
  const intakeItems = input.submittedIntakes.map(
    (i) =>
      `<strong>${escapeHtml(i.orgName)}</strong> — intake ingevuld${i.submittedAt ? ` (${fmtDate(i.submittedAt)})` : ""}, welcome-call voorbereiden`,
  );
  const reviewItems = input.projectsInReview.map(
    (p) =>
      `<strong>${escapeHtml(p.orgName)}</strong> — "${escapeHtml(p.name)}" staat op review, handover-checklist afmaken`,
  );
  const ticketItems = input.highPriorityTickets.map(
    (t) =>
      `<strong>${escapeHtml(t.orgName)}</strong> — high-priority ticket: "${escapeHtml(t.subject)}"`,
  );
  const staleItems = input.staleProjects.map(
    (s) =>
      `<strong>${escapeHtml(s.orgName)}</strong> — "${escapeHtml(s.projectName)}" heeft 7+ dagen geen update gehad`,
  );

  const adminUrl = ADMIN_BASE_URL.replace("https://", "https://admin.").replace(
    "webstability.eu",
    "webstability.eu",
  );

  const bodyTable = `<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;border-top:2px solid ${COLORS.accent};">
<tr><td style="padding:28px 32px 0 32px;"><p style="margin:0 0 12px 0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">// vandaag voor jou · ${escapeHtml(today)}</p><h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.25;color:${COLORS.text};">${total} ${total === 1 ? "ding" : "dingen"} dat${total === 1 ? "" : ""} op je wacht${total === 1 ? "t" : ""}</h1></td></tr>
${section("Leads om op te volgen", leadItems)}
${section("Aankomende calls", callItems)}
${section("Intakes ingevuld", intakeItems)}
${section("Projecten op review", reviewItems)}
${section("High-priority tickets", ticketItems)}
${section("Stille build-projecten", staleItems)}
<tr><td style="padding:22px 32px 28px 32px;"><a href="${escapeHtml(adminUrl)}/admin" target="_blank" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};padding:10px 20px;font-size:14px;font-weight:500;text-decoration:none;border-radius:999px;">Open de admin →</a></td></tr>
</table>`;

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="color-scheme" content="light only"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};"><tr><td align="center" style="padding:40px 16px;">${bodyTable}</td></tr></table></body></html>`;

  const lines: string[] = [`Vandaag voor jou — ${today}`, ""];
  const pushSection = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push(`${title}:`);
    for (const i of items) lines.push(`- ${i.replace(/<[^>]+>/g, "")}`);
    lines.push("");
  };
  pushSection("Leads om op te volgen", leadItems);
  pushSection("Aankomende calls", callItems);
  pushSection("Intakes ingevuld", intakeItems);
  pushSection("Projecten op review", reviewItems);
  pushSection("High-priority tickets", ticketItems);
  pushSection("Stille build-projecten", staleItems);
  lines.push(`Admin: ${adminUrl}/admin`);

  return { html, text: lines.join("\n"), subject };
}

export async function sendDailyDigest(input: DailyDigestInput): Promise<void> {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM not configured");
  const { html, text, subject } = renderDailyDigest(input);
  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    to: STAFF_NOTIFY_TO,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    html,
  });
}
