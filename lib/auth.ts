import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { renderMagicLinkEmail } from "@/lib/email/magic-link";

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
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, expires, provider }) {
        const { subject, html, text } = renderMagicLinkEmail({ url, expires });
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
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
});
