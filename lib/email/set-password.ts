// "Stel je wachtwoord in"-mail — verstuurd bij (a) een nieuwe bestelling/
// pakket-koop (account auto-aangemaakt), (b) "wachtwoord vergeten", of (c)
// als staff handmatig een account aanmaakt. Plain HTML, inline styles, brand-
// palette — net als de magic-link- en welkom-mails. Faalt graceful (caller
// vangt 'm).

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

type Locale = "nl" | "es";

type Variant = "checkout" | "reset" | "set";

function copy(locale: Locale, variant: Variant) {
  const nl = {
    checkout: {
      subject: "Je bestelling is binnen — stel je wachtwoord in",
      eyebrow: "// account aangemaakt",
      heading: "Welkom — je account staat klaar.",
      intro: (n: string) =>
        `Hoi ${n}, bedankt voor je bestelling. Ik heb alvast je account aangemaakt. Klik hieronder om je wachtwoord in te stellen — daarna log je gewoon in met je e-mail en wachtwoord, wanneer je maar wilt.`,
      button: "Stel je wachtwoord in",
    },
    reset: {
      subject: "Je wachtwoord opnieuw instellen",
      eyebrow: "// wachtwoord",
      heading: "Nieuw wachtwoord instellen.",
      intro: (n: string) =>
        `Hoi ${n}, klik op de knop om een nieuw wachtwoord te kiezen. Heb je dit niet aangevraagd? Negeer deze mail — er verandert niets.`,
      button: "Kies een nieuw wachtwoord",
    },
    set: {
      subject: "Stel je wachtwoord in voor het portaal",
      eyebrow: "// klantportaal",
      heading: "Stel je wachtwoord in.",
      intro: (n: string) =>
        `Hoi ${n}, klik op de knop om een wachtwoord te kiezen. Daarna log je in met je e-mail en wachtwoord.`,
      button: "Stel je wachtwoord in",
    },
  } as const;
  const es = {
    checkout: {
      subject: "Tu pedido ha llegado — establece tu contraseña",
      eyebrow: "// cuenta creada",
      heading: "Bienvenido — tu cuenta está lista.",
      intro: (n: string) =>
        `Hola ${n}, gracias por tu pedido. Ya he creado tu cuenta. Pulsa abajo para establecer tu contraseña — luego entras con tu correo y contraseña, cuando quieras.`,
      button: "Establecer tu contraseña",
    },
    reset: {
      subject: "Restablecer tu contraseña",
      eyebrow: "// contraseña",
      heading: "Nueva contraseña.",
      intro: (n: string) =>
        `Hola ${n}, pulsa el botón para elegir una nueva contraseña. ¿No lo has pedido? Ignora este correo — no cambia nada.`,
      button: "Elegir nueva contraseña",
    },
    set: {
      subject: "Establece tu contraseña para el portal",
      eyebrow: "// portal cliente",
      heading: "Establece tu contraseña.",
      intro: (n: string) =>
        `Hola ${n}, pulsa el botón para elegir una contraseña. Luego entras con tu correo y contraseña.`,
      button: "Establecer tu contraseña",
    },
  } as const;
  const common =
    locale === "es"
      ? {
          fallback: "¿No funciona el botón? Pega este enlace en tu navegador:",
          expires: "El enlace es válido durante 3 días.",
          signoff: "Hasta pronto,",
          sender: "Laurens Bos",
          senderRole: "Webstability",
          footerTagline: "Un sistema que funciona — construido y mantenido por una persona.",
          hi: "hola",
        }
      : {
          fallback: "Werkt de knop niet? Plak deze link in je browser:",
          expires: "De link is 3 dagen geldig.",
          signoff: "Tot snel,",
          sender: "Laurens Bos",
          senderRole: "Webstability",
          footerTagline:
            "Eén systeem dat draait — gebouwd en in de lucht gehouden door één persoon.",
          hi: "hoi",
        };
  return { ...(locale === "es" ? es[variant] : nl[variant]), ...common };
}

export async function sendSetPasswordMail(input: {
  to: string;
  name: string | null;
  url: string;
  locale?: Locale;
  /** Admin-subdomein — alleen relevant voor de copy-toon (nu gelijk gehouden). */
  adminHost?: boolean;
  /** true = de gebruiker had al een wachtwoord (reset), false = eerste keer. */
  isReset?: boolean;
  /** true = aangemaakt via een checkout/pakket-koop. */
  fromCheckout?: boolean;
}): Promise<void> {
  const locale: Locale = input.locale === "es" ? "es" : "nl";
  const variant: Variant = input.fromCheckout ? "checkout" : input.isReset ? "reset" : "set";
  const t = copy(locale, variant);
  const first = (input.name ?? "").split(" ")[0]?.trim() || t.hi;

  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t.subject)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
      <tr><td style="padding:28px 30px 0">
        <p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(t.eyebrow)}</p>
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${COLORS.text}">${escapeHtml(t.heading)}</h1>
        <p style="margin:8px 0 0;color:${COLORS.muted};font-size:15px;line-height:1.6">${escapeHtml(t.intro(first))}</p>
      </td></tr>
      <tr><td style="padding:24px 30px 8px">
        <a href="${escapeHtml(input.url)}" style="display:inline-block;background:${COLORS.text};color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:999px">${escapeHtml(t.button)} →</a>
      </td></tr>
      <tr><td style="padding:8px 30px 0">
        <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.5">${escapeHtml(t.fallback)}<br><span style="word-break:break-all;color:${COLORS.accent}">${escapeHtml(input.url)}</span></p>
        <p style="margin:10px 0 0;color:${COLORS.muted};font-size:12px">${escapeHtml(t.expires)}</p>
      </td></tr>
      <tr><td style="padding:22px 30px 26px">
        <p style="margin:18px 0 0;color:${COLORS.text};font-size:15px;line-height:1.6">${escapeHtml(t.signoff)}<br>${escapeHtml(t.sender)}<br><span style="color:${COLORS.muted}">${escapeHtml(t.senderRole)}</span></p>
      </td></tr>
      <tr><td style="padding:14px 30px;background:${COLORS.bgWarm};border-top:1px solid ${COLORS.border}">
        <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.5">${escapeHtml(t.footerTagline)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `${t.heading}\n\n${t.intro(first)}\n\n${t.button}: ${input.url}\n\n${t.expires}\n\n${t.signoff}\n${t.sender} — ${t.senderRole}`;

  const transport = createTransport(SMTP_SERVER);
  await transport.sendMail({
    from: MAIL_FROM,
    to: input.to,
    bcc: auditBcc(input.to),
    subject: t.subject,
    html,
    text,
  });
}
