// Branded magic-link email template. Plain HTML — no React renderer
// dependency. Inline styles only, since most clients strip <style>.
//
// Palette mirrors the site (cream + terracotta) so the email feels like
// a continuation of the brand instead of a generic auth notice.

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
    heading: string;
    intro: string;
    button: string;
    fallback: string;
    expiresLine: (mins: number) => string;
    notYouTitle: string;
    notYouBody: string;
    footerTagline: string;
    footerSystems: string;
  }
> = {
  nl: {
    preheader: "Je inloglink voor het webstability-portaal.",
    eyebrow: "// klantportaal",
    heading: "Welkom terug.",
    intro: "Klik op de knop om in te loggen. De link werkt één keer en is geldig voor 24 uur.",
    button: "Open je portal",
    fallback: "Werkt de knop niet? Plak deze link in je browser:",
    expiresLine: (m) => `Verloopt over ${m} minuten — of zodra je 'm gebruikt.`,
    notYouTitle: "Niet jij?",
    notYouBody: "Geen probleem — negeer deze e-mail en er gebeurt niets.",
    footerTagline: "Eén ontwikkelaar. Software die blijft werken.",
    footerSystems: "alle systemen draaien",
  },
  es: {
    preheader: "Tu enlace de acceso al portal de webstability.",
    eyebrow: "// portal cliente",
    heading: "Bienvenido de nuevo.",
    intro:
      "Haz clic en el botón para entrar. El enlace funciona una vez y es válido durante 24 horas.",
    button: "Abrir tu portal",
    fallback: "¿No funciona el botón? Pega este enlace en tu navegador:",
    expiresLine: (m) => `Caduca en ${m} minutos — o en cuanto lo uses.`,
    notYouTitle: "¿No eras tú?",
    notYouBody: "Sin problema — ignora este correo y no pasa nada.",
    footerTagline: "Un solo desarrollador. Software que sigue funcionando.",
    footerSystems: "todo en línea",
  },
};

function detectLocale(url: string): Locale {
  // Magic-link callbacks include the locale in the path; we read it back
  // from the callbackUrl so the email matches the user's chosen language.
  try {
    const parsed = new URL(url);
    const cb = parsed.searchParams.get("callbackUrl") ?? "";
    if (/\/es(\/|$|\?)/.test(cb) || /\/es\b/.test(parsed.pathname)) return "es";
  } catch {
    // ignore
  }
  return "nl";
}

export function renderMagicLinkEmail({ url, expires }: { url: string; expires: Date }) {
  const locale = detectLocale(url);
  const t = COPY[locale];
  const minutes = Math.max(1, Math.round((expires.getTime() - Date.now()) / 60000));

  const subject =
    locale === "es" ? "Tu enlace de acceso — webstability" : "Je inloglink — webstability";

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
    <!-- Preheader (hidden in clients but shown in inbox preview) -->
    <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(t.preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">

          <!-- Card -->
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">

            <!-- Header strip with logo -->
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:8px;line-height:0;">
                      <!-- Inline LogoMark — geometric "ws" -->
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
                <h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:32px;line-height:1.1;letter-spacing:-0.01em;color:${COLORS.text};">
                  ${escapeHtml(t.heading)}
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:${COLORS.muted};">
                  ${escapeHtml(t.intro)}
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${COLORS.text};border-radius:999px;">
                      <a href="${escapeAttr(url)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:${COLORS.bg};text-decoration:none;font-family:inherit;">
                        ${escapeHtml(t.button)} →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Expires note -->
            <tr>
              <td style="padding:16px 32px 28px 32px;">
                <p style="margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${COLORS.muted};">
                  ${escapeHtml(t.expiresLine(minutes))}
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 32px;">
                <div style="height:1px;background:${COLORS.border};"></div>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:24px 32px;">
                <p style="margin:0 0 8px 0;font-size:13px;color:${COLORS.muted};">
                  ${escapeHtml(t.fallback)}
                </p>
                <p style="margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;line-height:1.45;word-break:break-all;color:${COLORS.text};">
                  <a href="${escapeAttr(url)}" target="_blank" style="color:${COLORS.accent};text-decoration:underline;">${escapeHtml(url)}</a>
                </p>
              </td>
            </tr>

            <!-- Not-you box -->
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgWarm};border:1px solid ${COLORS.border};border-radius:8px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="margin:0 0 4px 0;font-size:13px;font-weight:500;color:${COLORS.text};">
                        ${escapeHtml(t.notYouTitle)}
                      </p>
                      <p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.muted};">
                        ${escapeHtml(t.notYouBody)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin-top:24px;">
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
    t.heading,
    "",
    t.intro,
    "",
    `${t.button}: ${url}`,
    "",
    t.expiresLine(minutes),
    "",
    `${t.notYouTitle} ${t.notYouBody}`,
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
