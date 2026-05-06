import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { renderMagicLinkEmail } from "@/lib/email/magic-link";
import { renderWelcomeEmail } from "@/lib/email/welcome";

const SMTP_SERVER = {
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

// Auto-BCC every transactional mail to the studio inbox so we can
// audit copy in production. Set MAIL_AUDIT_BCC="" to disable.
const MAIL_AUDIT_BCC = process.env.MAIL_AUDIT_BCC ?? "hello@webstability.eu";

// Drop the BCC when the recipient IS the audit address — otherwise
// the studio inbox gets the same mail twice.
function auditBcc(to: string): string | undefined {
  if (!MAIL_AUDIT_BCC) return undefined;
  if (to.trim().toLowerCase() === MAIL_AUDIT_BCC.toLowerCase()) return undefined;
  return MAIL_AUDIT_BCC;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  providers: [
    Nodemailer({
      server: SMTP_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, expires, provider }) {
        const { subject, html, text } = renderMagicLinkEmail({ url, expires });
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          bcc: auditBcc(identifier),
          subject,
          text,
          html,
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`magic-link email failed: ${failed.join(", ")}`);
        }
      },
    }),
  ],
  events: {
    /**
     * Fired exactly once when the adapter inserts a new user row — the
     * first time someone successfully clicks a magic-link for an email
     * that wasn't previously known. Send a branded welcome email so the
     * very first portal visit feels intentional, not random.
     *
     * Failures are logged but never thrown — a flaky SMTP delivery
     * shouldn't block the user from actually getting into the portal.
     */
    async createUser({ user }) {
      if (!user.email || !process.env.EMAIL_FROM) return;
      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "https://webstability.eu";
        const locale: "nl" | "es" =
          (user as { locale?: "nl" | "es" }).locale === "es" ? "es" : "nl";
        const portalUrl = `${baseUrl}/${locale}/portal/dashboard`;
        const { subject, html, text } = renderWelcomeEmail({
          name: user.name ?? null,
          portalUrl,
          locale,
        });
        const transport = createTransport(SMTP_SERVER);
        await transport.sendMail({
          to: user.email,
          from: process.env.EMAIL_FROM,
          bcc: auditBcc(user.email),
          subject,
          text,
          html,
        });
      } catch (err) {
        console.error("[auth] welcome email failed:", err);
      }
    },
  },
});
