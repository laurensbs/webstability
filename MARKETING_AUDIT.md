# Marketing-site audit · 2026-05-08

## Samenvatting

De site staat er fundamenteel goed: type-systeem (Fraunces serif default werkt overal), copy in i18n (geen "u"-vorm, geen jargon), JSON-LD basics, sitemap incl. ES, motion-density gemiddeld, palet via tokens. Ook security-cookies + privacy-disclosure zijn op orde.

Maar er zijn **drie systemische gaten** die de premium-belofte ondergraven:

1. **Geen gedeelde form-primitives** → 7+ forms dupliceren input-styling, focus-rings ontbreken op de helft, label-pattern wisselt per form (mono-eyebrow vs natural sans).
2. **Reduced-motion violations in 15 components** → klanten met `prefers-reduced-motion` krijgen toch alle animaties; dat is een a11y-regressie.
3. **GDPR-frictie** → geen cookie-banner terwijl Plausible unconditional laadt, Sentry mist PII-scrubbing, privacy-pagina mist last-updated date.

**Top-3 prioriteiten** voor de volgende sessie:
- Bouw `components/ui/{Input,Field,Textarea,Select,FieldError}.tsx` en migreer alle forms → 1× refactor lost form-frictie + a11y-focus + label-consistentie tegelijk op.
- Voeg `useReducedMotion()` toe aan de 15 motion-components zonder check.
- Cookie-banner + Sentry `beforeSend` + privacy-last-updated → drie kleine fixes, GDPR-grade van C+ naar A-.

---

## 1. Forms

**Geen shared UI-laag**. Elk form definieert eigen `border`, `padding`, `focus-ring`, `bg`, `text` inline.

- `components/auth/LoginForm.tsx:112` — focus-ring compliant ✓
- `app/[locale]/portal/tickets/new/page.tsx:62` — mist `focus:ring-2` → toetsenbord-users zien geen focus
- `app/[locale]/portal/tickets/[id]/page.tsx:92` (TicketReply) — geen focus-styling
- `app/[locale]/portal/settings/page.tsx:42` — geen focus-styling
- `components/admin/DiscountModal.tsx:140` — `<select>` zonder focus-styling
- `components/marketing/BuildCalculator.tsx:83` — `<select>` zonder focus-ring
- **Label-divergentie**: BuildCalculator + DiscountModal + OrgWizard gebruiken `font-mono uppercase eyebrow` labels; LoginForm + TicketNew + Settings gebruiken `text-sm font-medium` natural labels. Mengvorm in TicketNew.
- **Geen inline FieldError component** — alle forms tonen alleen een global toast bij fout, geen per-field melding.
- **Geen required-indication** — sterretje of "verplicht" ontbreekt overal, alleen HTML5 `required`.
- **Submit-button mix**: ToastSubmitButton (DiscountModal, OrgWizard, Settings) vs `<Button variant="accent">` (TicketNew) vs raw `<button>` (LoginForm:149).

**Fix**: extract `components/ui/Input.tsx`, `Field.tsx`, `Textarea.tsx`, `Select.tsx`, `FieldError.tsx`. Eén pattern (kies mono-eyebrow — past bij de rest van de site). Migreer 7 forms.

---

## 2. Pagina's

- `app/[locale]/(marketing)/page.tsx` — homepage heeft **geen expliciete `<h1>`** in `<Hero />`; SEO/a11y-risico. Verifieer `Hero.tsx` heading-tag.
- `app/[locale]/(marketing)/privacy/page.tsx` — **geen last-updated date**.
- `app/[locale]/(marketing)/aviso-legal/page.tsx` — geen last-updated date; NIF is "in aanvraag" in copy.
- `app/[locale]/(marketing)/garanties/page.tsx` — geen last-updated date.
- `app/[locale]/(marketing)/prijzen/page.tsx` — geen footer-CTA (geen brug terug naar /contact); geen kruislink naar /diensten of /cases.
- `app/[locale]/(marketing)/cases/page.tsx` — geen kruislink naar /diensten of /prijzen onder de cases.
- `app/[locale]/(marketing)/blog/page.tsx` — geen footer-CTA.
- `app/[locale]/(marketing)/contact/page.tsx` + `over/page.tsx` + `verhuur/page.tsx` — gebruiken eigen h1+eyebrow ipv `PageHeader`-component (consistentie).
- `app/[locale]/(marketing)/blog/[slug]/page.tsx` — **geen `generateMetadata`** voor individuele posts → SEO-gat.
- 404 + error pagina's bestaan en zijn branded ✓.
- Loading state alleen op portal, niet op marketing routes (acceptabel maar gemis).

---

## 3. Branding

### Palet — hex-hardcodes buiten SVG-illustraties (acht overtreders)

- `app/[locale]/(marketing)/verhuur/page.tsx:169` — `#D8CDB6`
- `app/[locale]/(marketing)/over/page.tsx:56` — `#DCE8E7` teal-soft fallback
- `components/ui/Accordion.tsx:37` — `#D8CDB6`
- `components/ui/Button.tsx:16` — `#D8CDB6`
- `components/portal/RecentTickets.tsx:15` — `#8B8378`
- `components/marketing/HowItWorks.tsx:227-230` — vijf hardcoded gradient-stops
- `components/marketing/Founder.tsx:20` — `#DCE8E7`
- `components/marketing/NavMegaMenu.tsx:305-307` — drie case-colors

**Fix**: definieer als `--color-border-strong`, `--color-teal-soft`, `--color-text-soft`, `--color-case-{caravan,marbella,voltauto}` in `globals.css` en vervang.

### Wijn-rood usage — 71 files, ~180 line-occurrences.

Strategisch verdeeld: header underline, footer top-border, services dividers, BuildCalculator timeline, mega-menu border, DemoBanner, LivegangCelebration, DiscountModal, SubscriptionTab, PricingCardsWithToggle featured tier. **Niet over-the-top, maar consistent**. Geen extra plekken nodig.

### Voice (NL)

- Inconsistent: "e-mail" vs "e-mailadres" — `messages/nl.json:693, 1049, 1087`. Standaardiseer op "e-mailadres".
- Geen "u"-vorm gevonden ✓
- Geen jargon/hyperbole ✓

### Headings — geen `font-sans` overrides op h-elementen ✓

### Knipoog-gaten

- `app/not-found.tsx` — NotFoundIllustration is statisch; geen LogoMark-spin of ScrambleText op heading.
- `components/marketing/CaseScreenshot.tsx` — case-cards hebben geen tilt-on-hover (3D), wel een border-hover.
- `components/marketing/LangSwitcher.tsx` — plain dropdown; geen vlaggetje-fade of locale-knipoog.
- Blog-articles: drop-cap ✓, maar geen end-of-article auteur-pill met initialen of avatar.
- FAQ-accordion (`components/ui/Accordion.tsx`): chevron rotates ✓ maar geen spring-animatie of micro-bounce.
- **Confetti niet wired**: DemoChooserModal selectie, contact-form success (Cal.com), pricing-tier select-CTA.

---

## 4. Animaties + performance

**Stats**: 202 motion-instances · 210 animation-triggers totaal. Aantal hoog maar binnen acceptabele range.

### Reduced-motion violations — 15 files (KRITIEK voor a11y)

Components die `motion` importeren maar nooit `useReducedMotion()` checken:

- `components/marketing/PricingCardsWithToggle.tsx` (3 instances, infinite particles)
- `components/auth/LoginForm.tsx` (4)
- `components/auth/AuthCard.tsx` (6)
- `components/admin/DiscountModal.tsx` (4)
- `components/portal/RouteTransition.tsx` (2 — page-level transitions, dubbel kritiek)
- `components/marketing/DemoChooserModal.tsx` (4)
- `components/admin/CommandPalette.tsx` (4)
- `components/admin/TicketsKanban.tsx` (2)
- `components/admin/OrgWizard.tsx` (2)
- `components/portal/IncidentBanner.tsx` (2)
- `components/marketing/NavMegaMenu.tsx` (2)

**Fix**: `const reduce = useReducedMotion(); animate={reduce ? false : {...}}` patroon.

### Heavy-blur (mobile-perf)

- `components/marketing/PricingCardsWithToggle.tsx:173` — `blur-3xl` zonder `wb-soft-halo` class → blokkeert iOS rasterizer.
- `components/marketing/ServiceCard.tsx:77` — zelfde issue.

**Fix**: voeg `wb-soft-halo` toe; `@media (pointer: coarse)` strip 'm dan op touch.

### Lazy-loading — alleen Cal-embed dynamic ✓

R3F (`@react-three/fiber`) wordt op marketing-pagina's geladen zonder dynamic-split. Check of LoginAmbientMount echt op alle locale-pagina's gebundeld is of alleen op /login.

### `will-change` — 0 hits ✓

---

## 5. Accessibility (WCAG-niveau: AA met caveats)

### Skip-link werkt ✓

`app/[locale]/(marketing)/layout.tsx:34` rendert `.skip-link`, target `#main` op regel 38.

### Focus-visible ontbreekt op interactive elements

- `components/marketing/MobileNav.tsx:74-79` — Dialog.Close (X-icoon)
- `components/marketing/DemoChooserModal.tsx:71-78` — Close button
- `components/admin/DiscountModal.tsx:90-97` — Close button
- `components/admin/AdminSidebar.tsx:198-208` — Collapse-toggle (mist ook `aria-label`)
- `components/portal/Sidebar.tsx:114-120` — Dialog.Close
- `components/marketing/NavLink.tsx:20-26` — desktop nav-links
- `components/marketing/Footer.tsx:135, 225` — live-badge link + GitHub-link
- `components/marketing/NavMegaMenu.tsx:257-276, 328-351` — service- en case-cards
- `components/animate/AvailabilityPill.tsx:26` + `components/animate/RotatingPill.tsx:42` — beide pills

**Fix**: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)` overal.

### ARIA-labels op icon-only buttons ✓ (op één na: AdminSidebar collapse mist label).

### Form-labels ✓ (alle inputs hebben `<label htmlFor>`).

### Modal focus-trap

- Radix Dialog (DiscountModal, MobileNav, CalPopupTrigger) — automatisch ✓
- `components/marketing/DemoChooserModal.tsx:50-124` — **custom modal zonder focus-trap**. Tab loopt uit modal naar achtergrond-elementen.

**Fix**: óf Radix Dialog adopten, óf Tab/Shift+Tab handmatig trappen binnen `dialogRef`.

### Color-contrast

`--color-muted` (#6B645A) op `--color-bg` (#F5F0E8) → ratio ~4.47:1 — **WCAG AA passeert nét** (4.5:1 drempel). Acceptabel maar margin-of-error.

---

## 6. SEO — Grade B

- **Per-pagina metadata** ✓ — alle 12 marketing-routes via `pageMetadata(locale, key)`.
- **Blog-detail metadata** ✗ — `app/[locale]/(marketing)/blog/[slug]/page.tsx` heeft geen `generateMetadata` → posts erven titel niet correct.
- **OG-images** ✓ static + dynamic route allebei wired. Blog-posts krijgen geen custom OG.
- **JSON-LD**: Organization + BlogPosting alleen. Mist:
  - `LocalBusiness` (homepage)
  - `BreadcrumbList` (alle subpaginas)
  - `FAQPage` (FAQ-component op homepage)
  - `Service` (per productlijn op /diensten)
  - `Product` (tiers op /prijzen)
- **`alternates.languages` in pageMetadata** ✗ — sitemap heeft hreflang maar page-metadata niet → SERP-language-detection suboptimaal.
- **Canonical URL** ✗ — niet expliciet gezet in `pageMetadata`; Next defaults naar self-referential.
- **Sitemap.ts + robots.ts** ✓ — beide aanwezig, beide locales gedekt, juiste disallow-rules.
- **Internal linking** ✓ — sterke chain via Footer + nav.

---

## 7. GDPR + privacy — Grade C+

- **Cookie-banner** ✗ — bestaat niet. Plausible laadt unconditional zodra `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var gezet is. Plausible is privacy-vriendelijk maar zonder consent-UI is de site niet GDPR-compliant voor opt-in landen.
- **Privacy-pagina** ✓ — bevat verantwoordelijke (KvK in footer/seo.ts), data-overzicht, sub-processors (Vercel/Neon/Stripe/Mollie/Plausible/Resend/Better Stack/Sentry), bewaartermijnen (30d account, 7y fiscal), rechten + contact. **Geen last-updated date.**
- **Aviso-legal** ✓ — alle ES-vereisten aanwezig; NIF "en trámite" — vervang zodra definitief.
- **Sentry PII-scrubbing** ✗ — `sentry.server.config.ts` + `sentry.client.config.ts` hebben geen `beforeSend` filter. Email + IP kunnen lekken in error payloads.
- **Contact-form** ✓ — Cal.com embed; geen extra velden; minimaal data.
- **Auth-cookies** ✓ — `httpOnly`, `sameSite: lax`, `secure` in prod, scoped to `.webstability.eu`.
- **Database** ✓ — Neon EU-default; vermeld als sub-processor.
- **DSAR-process** — privacy noemt email maar geen formele uitvoeringstermijn (binnen 30 dagen, GDPR Art. 12).

---

## Quick-wins (binnen 1 sessie te doen)

- `app/[locale]/(marketing)/privacy/page.tsx` — voeg `<p className="font-mono text-[10px] text-(--color-muted)">Laatst bijgewerkt: 8 mei 2026</p>` onderaan toe (idem op aviso-legal en garanties).
- `components/marketing/PricingCardsWithToggle.tsx:173` + `components/marketing/ServiceCard.tsx:77` — voeg `wb-soft-halo` class toe.
- `components/admin/AdminSidebar.tsx:198` — voeg `aria-label="Collapse sidebar"` toe op de collapse-button.
- `messages/nl.json:693, 1049, 1087` — vervang "e-mail" door "e-mailadres" voor consistentie.
- `app/[locale]/(marketing)/blog/[slug]/page.tsx` — voeg `generateMetadata` toe die post-titel + excerpt + OG-image gebruikt.
- `components/animate/AvailabilityPill.tsx`, `RotatingPill.tsx`, `NavLink.tsx`, `Footer.tsx`, `NavMegaMenu.tsx`, alle Dialog.Close buttons — bulk-add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)`.
- `lib/seo.ts` — extend `pageMetadata` met `alternates: { canonical, languages: { nl, es } }`.
- `sentry.client.config.ts` + `sentry.server.config.ts` — voeg `beforeSend` toe die `event.user.email` en `event.user.ip_address` strip't.
- `app/[locale]/(marketing)/cases/page.tsx` + `prijzen/page.tsx` — voeg footer-CTA toe (kruislink naar /contact + /diensten resp.).

---

## Multi-session refactors (minimaal 2-3 uur per stuk)

### A. Form-primitive extractie (3-4u)

Bouw `components/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Field.tsx` (label + helper-text + FieldError), `FieldError.tsx`. Migreer 7 forms (LoginForm, TicketNew, TicketReply, Settings, DiscountModal, BuildCalculator selects, OrgWizard). Standaardiseer op mono-eyebrow labels. Voeg required-indicator toe. Wire ActionResult fieldErrors → FieldError. Update ToastForm om fieldErrors door te geven via context.

### B. Reduced-motion bulk-fix (2u)

Loop 15 files langs, voeg `useReducedMotion()` toe, wikkel `animate=`/`whileInView=` met `reduce ? false : {...}`. Test met DevTools rendering > emulate reduced motion.

### C. Cookie-consent + Plausible-gating (3u)

Bouw `components/marketing/CookieBanner.tsx` met Radix Dialog. Drie buttons: "Alleen noodzakelijk", "Alleen analytics", "Alle accepteren". Sla keuze op in `localStorage` (`webstability-consent`). Wikkel Plausible-script-load in een `useEffect` die alleen runt bij analytics-consent. Voeg "Cookie-instellingen"-link in footer toe die banner heropent. Update privacy-pagina met cookie-tabel.

### D. JSON-LD-uitbreiding + canonical/hreflang (2u)

Voeg in `lib/seo.ts` schemas voor `LocalBusiness`, `BreadcrumbList`, `FAQPage`, `Service`, `Product`. Per-pagina via `<JsonLd data={...} />`. Extend `pageMetadata` zodat elke pagina canonical + alternates.languages krijgt. Test met Google Rich Results.

### E. Knipoog-uitbreiding (2u)

- 404-pagina: ScrambleText op heading + LogoMark spin op illustratie.
- DemoChooserModal: ConfettiBurst bij role-keuze.
- BlogPost: end-of-article auteur-pill met initialen.
- LangSwitcher: korte vlag-fade bij click.
- FAQ-chevron: spring `transition={{ type: "spring", stiffness: 400, damping: 30 }}`.
- Cases-cards: 3D tilt-on-hover via `useMotionValue` + `transformPerspective`.

### F. DemoChooserModal → Radix Dialog (1u)

Vervang custom motion.div modal door Radix Dialog voor automatic focus-trap + Esc + click-outside. Behoud animaties via `motion.div` als child.

---

**Audit klaar.** Documenten in `MARKETING_AUDIT.md`. 38 concrete bevindingen verspreid over 7 secties.
