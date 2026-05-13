// Portal-invite mail — gestuurd als een org-owner een collega, partner
// of boekhouder uitnodigt via /portal/team. Niet hetzelfde als
// staff-invite (dat is voor Webstability-medewerkers in /admin); dit
// gaat naar een klant-organisatie. Rol-aware copy zodat een read_only
// boekhouder direct weet "ik kan alleen facturen + rapporten zien".
//
// Eerste login via magic-link op /login — bij verificatie zit de user
// al in de juiste org (zie app/actions/team.ts).
//
// Faalt graceful — caller (inviteMember) vangt 'm.

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

const MAIL_FROM = process.env.EMAIL_FROM ?? "Webstability <hello@webstability.eu>";
const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstability.eu").replace(/\/$/, "");

function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

type Role = "owner" | "member" | "read_only";
type Locale = "nl" | "es";

const COPY: Record<
  Locale,
  {
    subject: (orgName: string) => string;
    eyebrow: string;
    heading: (inviter: string) => string;
    leadIn: (orgName: string) => string;
    roleLine: Record<Role, string>;
    nextLine: string;
    cta: string;
    footer: string;
    signoff: string;
    sender: string;
  }
> = {
  nl: {
    subject: (org) => `Je bent toegevoegd aan ${org} op Webstability`,
    eyebrow: "// portal-uitnodiging",
    heading: (inviter) => `${inviter} heeft je toegang gegeven.`,
    leadIn: (org) =>
      `Je staat nu in het Webstability-portaal van ${org}. Daar zie je projecten, facturen, tickets en bestanden — afhankelijk van je rol.`,
    roleLine: {
      owner:
        "Je bent **eigenaar** — je kunt alles bekijken én wijzigen, en zelf weer collega's uitnodigen.",
      member:
        "Je bent **lid** — je kunt projecten volgen, tickets openen, bestanden uploaden. Alleen de eigenaar regelt facturatie + uitnodigingen.",
      read_only:
        "Je hebt **alleen-lezen-toegang** — handig voor je boekhouder of partner. Je ziet projecten, facturen en rapporten; je kunt niks wijzigen of nieuwe tickets openen.",
    },
    nextLine: "Inloggen gaat met een magic-link — geen wachtwoord nodig.",
    cta: "Open je portaal",
    footer: "Geen idee waar dit over gaat? Negeer deze mail; zonder klik gebeurt er niets.",
    signoff: "Tot in 't portaal,",
    sender: "Webstability",
  },
  es: {
    subject: (org) => `Te han añadido a ${org} en Webstability`,
    eyebrow: "// invitación al portal",
    heading: (inviter) => `${inviter} te ha dado acceso.`,
    leadIn: (org) =>
      `Ya tienes acceso al portal de Webstability de ${org}. Allí ves proyectos, facturas, tickets y archivos — según tu rol.`,
    roleLine: {
      owner:
        "Eres **propietario** — puedes verlo y modificarlo todo, e invitar a más colegas tú mismo.",
      member:
        "Eres **miembro** — puedes seguir proyectos, abrir tickets y subir archivos. Solo el propietario gestiona facturación + invitaciones.",
      read_only:
        "Tienes acceso de **solo lectura** — útil para tu contable o socio. Ves proyectos, facturas e informes; no puedes modificar nada ni abrir tickets nuevos.",
    },
    nextLine: "El acceso es por enlace mágico — no necesitas contraseña.",
    cta: "Abrir tu portal",
    footer: "¿No sabes de qué va? Ignora este correo; sin clic no pasa nada.",
    signoff: "Hasta en el portal,",
    sender: "Webstability",
  },
};

export async function sendPortalInviteMail(input: {
  to: string;
  orgName: string;
  inviterName: string | null;
  inviterEmail: string | null;
  role: Role;
  locale?: string;
}): Promise<void> {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const t = COPY[locale];
  const inviter = input.inviterName?.trim() || input.inviterEmail || "een collega";
  const loginPath = locale === "es" ? "/es/login" : "/login";
  const loginUrl = `${SITE_URL}${loginPath}?email=${encodeURIComponent(input.to)}`;
  const subject = t.subject(input.orgName);

  // Bold-token vervangen in roleLine — alleen voor HTML; text-versie strip 'm.
  const roleHtml = t.roleLine[input.role].replace(
    /\*\*(.+?)\*\*/g,
    `<strong style="font-weight:600;color:${COLORS.accent}">$1</strong>`,
  );
  const rolePlain = t.roleLine[input.role].replace(/\*\*/g, "");

  const html = `<!doctype html><html><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
        <tr><td style="border-top:2px solid ${COLORS.wine};padding:28px 28px 8px">
          <p style="margin:0 0 14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(t.heading(inviter))}</h1>
          <p style="margin:0 0 14px;color:${COLORS.muted};font-size:15px;line-height:1.6">${escapeHtml(t.leadIn(input.orgName))}</p>
          <p style="margin:0 0 6px;color:${COLORS.text};font-size:14.5px;line-height:1.65">${roleHtml}</p>
          <p style="margin:14px 0 0;color:${COLORS.muted};font-size:13px;line-height:1.6">${escapeHtml(t.nextLine)}</p>
        </td></tr>
        <tr><td style="padding:18px 28px 24px">
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:${COLORS.text};color:${COLORS.bg};text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:999px">${escapeHtml(t.cta)} →</a>
        </td></tr>
        <tr><td style="padding:0 28px 26px">
          <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.55">${escapeHtml(t.footer)}</p>
          <p style="margin:14px 0 0;color:${COLORS.text};font-size:14px;line-height:1.6">${escapeHtml(t.signoff)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.sender)}</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    t.heading(inviter),
    "",
    t.leadIn(input.orgName),
    "",
    rolePlain,
    "",
    t.nextLine,
    "",
    `${t.cta}: ${loginUrl}`,
    "",
    t.footer,
    "",
    `${t.signoff}`,
    t.sender,
  ].join("\n");

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
