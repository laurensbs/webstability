# Webstability

Premium one-man dev studio site (NL/ES) — Laurens' studio for MKB-ondernemers.
The site is the product demo: it has to set the bar that potential clients
expect from work delivered to them.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Tailwind v4 (CSS-first `@theme`) + Fraunces / Inter / JetBrains Mono
- next-intl 4 — `nl` (default, no prefix) and `es` (`/es`), translated slugs
- Drizzle ORM + Neon Postgres
- Auth.js v5 (next-auth beta) with Drizzle adapter, magic-link via Hostinger SMTP

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in secrets
pnpm db:migrate              # apply schema to your Neon database
pnpm db:seed                 # seed one demo org/user/project for local dev
pnpm dev
```

Open `http://localhost:3000` (NL) or `http://localhost:3000/es`.

## Scripts

| Command            | What                                                |
| ------------------ | --------------------------------------------------- |
| `pnpm dev`         | Next dev server (Turbopack)                         |
| `pnpm build`       | Production build                                    |
| `pnpm start`       | Run production build                                |
| `pnpm lint`        | ESLint                                              |
| `pnpm typecheck`   | `tsc --noEmit`                                      |
| `pnpm format`      | Prettier write                                      |
| `pnpm db:generate` | Generate SQL migration from schema changes          |
| `pnpm db:migrate`  | Apply pending migrations                            |
| `pnpm db:push`     | Sync schema directly (dev only — skips migrations)  |
| `pnpm db:studio`   | Open Drizzle Studio                                 |
| `pnpm db:seed`     | Seed demo data                                      |
| `pnpm test:e2e`    | Run Playwright e2e tests                            |

## Project layout

```
app/
  [locale]/                       # next-intl: nl, es
    (marketing)/                  # Public site (nav + footer)
      layout.tsx
      page.tsx                    # Home (placeholder, Phase 2 fills it in)
    login/page.tsx
    verify/page.tsx
    layout.tsx                    # Root layout, fonts, NextIntlClientProvider
  api/auth/[...nextauth]/route.ts
  actions/auth.ts                 # Server action wrappers
components/
  auth/LoginForm.tsx
  marketing/{Navigation,Footer}.tsx
  shared/LangSwitcher.tsx
i18n/
  routing.ts                      # locales + translated pathnames
  navigation.ts                   # typed Link/usePathname
  request.ts                      # server message loader
lib/
  auth.ts                         # NextAuth config (Drizzle + Nodemailer)
  db/{index,schema,seed}.ts
messages/
  {nl,es}.json
proxy.ts                          # Next 16: replaces middleware.ts
drizzle/                          # generated SQL migrations (committed)
```

## Phase status

The build follows the phased plan in
`~/.claude/plans/webstability-complete-rippling-sloth.md`.

- [x] Phase 1 — foundation (Next, i18n, Drizzle, Auth, marketing shell)
- [x] Phase 2 — marketing pages (home sections, verhuur, over, prijzen, status, contact, blog, garanties, aviso-legal, privacy, OG images, sitemap, robots)
- [x] Phase 3 — portal MVP (dashboard, projects, tickets, invoices, settings, auth-gate)
- [x] Phase 4 — portal advanced (monitoring live, SEO placeholder, files via Vercel Blob, team invites)
- [~] Phase 5 — polish (a11y skip-link + focus styles, Playwright e2e, build clean) — Lighthouse + native ES copy review pending
- [ ] Phase 6 — launch (domains, payments live, analytics)

## Integration status

| Integration       | Phase | Status   | Notes                                  |
| ----------------- | ----- | -------- | -------------------------------------- |
| Neon Postgres     | 1     | live     | `DATABASE_URL`                         |
| Hostinger SMTP    | 1     | live     | Magic-link auth                        |
| Stripe            | 3     | stubbed  | `STRIPE_*` env vars present            |
| Mollie            | 3     | stubbed  | `MOLLIE_*`                             |
| Plausible         | 5     | stubbed  | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`         |
| Sentry            | 5     | stubbed  | `SENTRY_*`                             |
| Better Stack      | 2     | live     | `BETTER_STACK_API_KEY` — /status + /portal/monitoring |
| Cal.com           | 2     | live     | Embed for /contact (cal.com/webstability) |
| DocuSeal          | 3     | stubbed  | E-signatures                           |
| Vercel Blob       | 4     | optional | Files in portal — graceful fallback when `BLOB_READ_WRITE_TOKEN` absent |
| Search Console    | 4     | stubbed  | Per-org OAuth — needs `GSC_OAUTH_*`    |

## Notes for future maintainers

- Next 16 renamed `middleware.ts` → `proxy.ts`. The file is at the project root.
- Tailwind v4 has no `tailwind.config.ts`; tokens live in `app/globals.css` under `@theme`.
- `next-intl` `Link`/`usePathname` are typed against the unlocalized internal paths defined in `i18n/routing.ts` — always import from `@/i18n/navigation`, never `next/link` directly.
- Auth.js v5 is in beta. Pin minor versions before going to prod.
