"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { ArrowLeft, ArrowRight, Check, Globe, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  estimateProjectPrice,
  CONFIG_OPTIONS,
  CONFIG_PALETTES,
  CONFIG_LANGUAGE_OPTIONS,
  PROJECT_PAGES_INCLUDED,
  PROJECT_MAX_PAGES,
  PROJECT_EXTRA_PAGE,
  type ProjectKind,
  type ConfigOptionId,
  type ConfigPaletteId,
  type ConfigLanguageId,
} from "@/lib/pricing";
import { submitProjectRequest } from "@/app/actions/configurator";
import { ConfettiBurst } from "@/components/animate/ConfettiBurst";

type StepKey = "kind" | "scope" | "look" | "language" | "options" | "details";
const ALL_STEPS: StepKey[] = ["kind", "scope", "look", "language", "options", "details"];

type Strings = {
  eyebrow: string;
  title: string;
  lede: string;
  stepLabel: string; // "stap {current} van {total}"
  back: string;
  next: string;
  submit: string;
  submitting: string;
  // step copy
  kindTitle: string;
  kindLede: string;
  kindWebsite: string;
  kindWebsiteBody: string;
  kindWebshop: string;
  kindWebshopBody: string;
  scopeTitle: string;
  scopeLede: string;
  scopePagesLabel: string;
  scopeIncluded: string; // "{n} pagina's inbegrepen"
  scopePerExtra: string; // "+€{price} per extra pagina"
  lookTitle: string;
  lookLede: string;
  lookCustomLabel: string;
  lookCustomPlaceholder: string;
  languageTitle: string;
  languageLede: string;
  optionsTitle: string;
  optionsLede: string;
  optionsNote: string;
  detailsTitle: string;
  detailsLede: string;
  nameLabel: string;
  emailLabel: string;
  companyLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  // summary panel
  summaryTitle: string;
  estimateLabel: string; // "richtprijs"
  estimateNote: string; // "±15% — definitieve offerte na een kort gesprek"
  summaryToggle: string; // mobiel: "Bekijk samenvatting"
  // success
  successTitle: string;
  successBody: string; // mag {low} {high} bevatten
  successCta: string; // "Boek meteen een kennismaking"
  successDone: string; // "Of sluit dit venster — we mailen je sowieso"
  // labels (records)
  palettes: Record<string, string>;
  languages: Record<string, string>;
  options: Record<string, string>;
  lineBaseWebsite: string; // "Website-basis (incl. {n} pagina's)"
  lineBaseWebshop: string;
  lineExtraPages: string; // "{n} extra pagina's"
};

const KIND_META: Record<ProjectKind, { icon: typeof Globe }> = {
  website: { icon: Globe },
  webshop: { icon: ShoppingBag },
};

const eur0 = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function ProjectConfigurator({
  strings,
  calLink,
  defaultKind = "website",
  lockKind = false,
}: {
  strings: Strings;
  /** Cal.com-link voor de "boek meteen"-knop op het successcherm (mag null). */
  calLink: string | null;
  /** Begin-type. Bij `lockKind` ook vast (de type-stap wordt overgeslagen) —
   * gebruikt wanneer de configurator op /diensten/website of /webshop staat. */
  defaultKind?: ProjectKind;
  lockKind?: boolean;
}) {
  const reduce = useReducedMotion();
  const stepOrder = React.useMemo<StepKey[]>(
    () => (lockKind ? ALL_STEPS.filter((s) => s !== "kind") : ALL_STEPS),
    [lockKind],
  );
  const [stepIdx, setStepIdx] = React.useState(0);
  const [kind, setKind] = React.useState<ProjectKind>(defaultKind);
  const [pages, setPages] = React.useState<number>(PROJECT_PAGES_INCLUDED[defaultKind]);
  const [palette, setPalette] = React.useState<ConfigPaletteId>("warm");
  const [customColor, setCustomColor] = React.useState("");
  const [language, setLanguage] = React.useState<ConfigLanguageId>("nl");
  const [options, setOptions] = React.useState<ConfigOptionId[]>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ lowCents: number; highCents: number } | null>(null);
  const [fire, setFire] = React.useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false);

  const included = PROJECT_PAGES_INCLUDED[kind];
  // Clamp afgeleid bij render (geen effect) — als het type wisselt zakt
  // 'pages' nooit onder het inbegrepen aantal van dat type.
  const pagesClamped = Math.max(included, Math.min(PROJECT_MAX_PAGES, pages));

  const estimate = React.useMemo(
    () => estimateProjectPrice({ kind, pages: pagesClamped, options }),
    [kind, pagesClamped, options],
  );

  const step = stepOrder[stepIdx]!;
  const total = stepOrder.length;
  const progressPct = Math.round(((stepIdx + 1) / total) * 100);

  const stepValid = ((): boolean => {
    if (step === "details")
      return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return true; // de andere stappen hebben altijd een geldige default
  })();

  const goNext = () => setStepIdx((i) => Math.min(total - 1, i + 1));
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const toggleOption = (id: ConfigOptionId) =>
    setOptions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("company", company);
    fd.set("message", message);
    fd.set("kind", kind);
    fd.set("pages", String(pagesClamped));
    fd.set("palette", palette);
    fd.set("customColor", customColor);
    fd.set("language", language);
    fd.set("options", options.join(","));
    try {
      const res = await submitProjectRequest(fd);
      if (res.ok) {
        setDone({ lowCents: res.lowCents, highCents: res.highCents });
        window.setTimeout(() => setFire(true), 300);
        window.setTimeout(() => setFire(false), 2000);
      } else if (res.error === "invalid_email") {
        toast.error("Vul een geldig e-mailadres in.");
      } else if (res.error === "missing_fields") {
        toast.error("Vul je naam en e-mailadres in.");
      } else {
        toast.error("Er ging iets mis. Probeer het opnieuw.");
      }
    } catch {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- success ---
  if (done) {
    return (
      <div className="relative mx-auto max-w-xl text-center">
        <ConfettiBurst fire={fire} anchor="top" variant="success" />
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-(--color-accent)/15 text-(--color-accent)"
        >
          <Check className="h-8 w-8" strokeWidth={2.4} />
        </motion.div>
        <h2 className="mt-8 font-serif text-[clamp(26px,4vw,38px)] leading-tight">
          {strings.successTitle}
        </h2>
        <p className="mt-4 text-[15px] leading-[1.6] text-(--color-muted)">
          {strings.successBody
            .replace("{low}", eur0(done.lowCents))
            .replace("{high}", eur0(done.highCents))}
        </p>
        {calLink ? (
          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[14px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {strings.successCta}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <p className="mt-4 font-mono text-[11px] tracking-wide text-(--color-muted)/70">
          {strings.successDone}
        </p>
      </div>
    );
  }

  // --- summary panel content (gedeeld tussen desktop sidebar + mobile drawer) ---
  const lineLabel = (labelKey: string, meta?: Record<string, unknown>): string => {
    if (labelKey === "base.website")
      return strings.lineBaseWebsite.replace("{n}", String(meta?.includedPages ?? included));
    if (labelKey === "base.webshop")
      return strings.lineBaseWebshop.replace("{n}", String(meta?.includedPages ?? included));
    if (labelKey === "extraPages")
      return strings.lineExtraPages.replace("{n}", String(meta?.count ?? 0));
    if (labelKey.startsWith("options.")) {
      const id = labelKey.slice("options.".length);
      return strings.options[id] ?? id;
    }
    return labelKey;
  };

  const SummaryBody = (
    <div className="space-y-4">
      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {strings.summaryTitle}
      </p>
      <ul className="space-y-1.5 text-[13px]">
        {estimate.lines.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="text-(--color-muted)">{lineLabel(l.labelKey, l.meta)}</span>
            <span className="shrink-0 tabular-nums">{eur0(l.cents)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-(--color-border) pt-3">
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {strings.estimateLabel}
        </p>
        <p className="mt-1 font-serif text-[26px] leading-none">
          <NumberFlow
            value={estimate.lowCents / 100}
            format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
          />
          {" – "}
          <NumberFlow
            value={estimate.highCents / 100}
            format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
          />
        </p>
        <p className="mt-2 text-[12px] leading-snug text-(--color-muted)">{strings.estimateNote}</p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      {/* Wizard kolom */}
      <div className="min-w-0">
        {/* Voortgang */}
        <div className="mb-8">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            <span>
              {strings.stepLabel
                .replace("{current}", String(stepIdx + 1))
                .replace("{total}", String(total))}
            </span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-(--color-border)">
            <motion.div
              className="h-full bg-(--color-accent)"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === "kind" ? (
              <StepShell title={strings.kindTitle} lede={strings.kindLede}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["website", "webshop"] as ProjectKind[]).map((k) => {
                    const Icon = KIND_META[k].icon;
                    const active = kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={active}
                        className={`flex flex-col items-start gap-3 rounded-2xl border px-5 py-5 text-left transition-colors ${
                          active
                            ? "border-(--color-accent) bg-(--color-accent-soft)/40"
                            : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)/40"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${active ? "text-(--color-accent)" : "text-(--color-muted)"}`}
                        />
                        <span className="text-[16px] font-medium">
                          {k === "website" ? strings.kindWebsite : strings.kindWebshop}
                        </span>
                        <span className="text-[13px] leading-snug text-(--color-muted)">
                          {k === "website" ? strings.kindWebsiteBody : strings.kindWebshopBody}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </StepShell>
            ) : null}

            {step === "scope" ? (
              <StepShell title={strings.scopeTitle} lede={strings.scopeLede}>
                <label className="block">
                  <span className="mb-3 block font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                    {strings.scopePagesLabel}:{" "}
                    <span className="text-(--color-accent)">{pagesClamped}</span>
                  </span>
                  <input
                    type="range"
                    min={included}
                    max={PROJECT_MAX_PAGES}
                    value={pagesClamped}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full accent-(--color-accent)"
                  />
                  <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-(--color-muted)">
                    <span>{strings.scopeIncluded.replace("{n}", String(included))}</span>
                    <span>
                      {strings.scopePerExtra.replace("{price}", String(PROJECT_EXTRA_PAGE))}
                    </span>
                  </div>
                </label>
              </StepShell>
            ) : null}

            {step === "look" ? (
              <StepShell title={strings.lookTitle} lede={strings.lookLede}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.keys(CONFIG_PALETTES) as ConfigPaletteId[]).map((id) => {
                    const active = palette === id;
                    const sw = CONFIG_PALETTES[id].swatch;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPalette(id)}
                        aria-pressed={active}
                        className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors ${
                          active
                            ? "border-(--color-accent) bg-(--color-accent-soft)/40"
                            : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)/40"
                        }`}
                      >
                        <span className="flex h-8 w-full overflow-hidden rounded-md">
                          {sw.map((c, i) => (
                            <span key={i} className="flex-1" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                        <span className="text-[14px] font-medium">
                          {strings.palettes[id] ?? id}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                    {strings.lookCustomLabel}
                  </span>
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder={strings.lookCustomPlaceholder}
                    className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
                  />
                </label>
              </StepShell>
            ) : null}

            {step === "language" ? (
              <StepShell title={strings.languageTitle} lede={strings.languageLede}>
                <div className="grid gap-2">
                  {CONFIG_LANGUAGE_OPTIONS.map((id) => {
                    const active = language === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setLanguage(id)}
                        aria-pressed={active}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors ${
                          active
                            ? "border-(--color-accent) bg-(--color-accent-soft)/40 font-medium"
                            : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-accent)/40"
                        }`}
                      >
                        <span
                          className={`grid h-4 w-4 place-items-center rounded-full border ${active ? "border-(--color-accent)" : "border-(--color-border)"}`}
                        >
                          {active ? (
                            <span className="h-2 w-2 rounded-full bg-(--color-accent)" />
                          ) : null}
                        </span>
                        {strings.languages[id] ?? id}
                      </button>
                    );
                  })}
                </div>
              </StepShell>
            ) : null}

            {step === "options" ? (
              <StepShell title={strings.optionsTitle} lede={strings.optionsLede}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(CONFIG_OPTIONS) as ConfigOptionId[]).map((id) => {
                    const active = options.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleOption(id)}
                        aria-pressed={active}
                        className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors ${
                          active
                            ? "border-(--color-accent) bg-(--color-accent-soft)/40"
                            : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${active ? "border-(--color-accent) bg-(--color-accent)" : "border-(--color-border)"}`}
                          >
                            {active ? (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            ) : null}
                          </span>
                          <span className={active ? "font-medium" : "text-(--color-muted)"}>
                            {strings.options[CONFIG_OPTIONS[id].labelKey] ?? id}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-(--color-muted)">
                          +€{CONFIG_OPTIONS[id].price}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[12px] leading-snug text-(--color-muted)">
                  {strings.optionsNote}
                </p>
              </StepShell>
            ) : null}

            {step === "details" ? (
              <StepShell title={strings.detailsTitle} lede={strings.detailsLede}>
                <div className="space-y-4">
                  <FieldInput label={strings.nameLabel} required value={name} onChange={setName} />
                  <FieldInput
                    label={strings.emailLabel}
                    required
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />
                  <FieldInput label={strings.companyLabel} value={company} onChange={setCompany} />
                  <label className="block">
                    <span className="mb-2 block font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
                      {strings.messageLabel}
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={strings.messagePlaceholder}
                      rows={4}
                      className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
                    />
                  </label>
                </div>
              </StepShell>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Mobiel: samenvatting-toggle */}
        <div className="mt-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-[13px]"
          >
            <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {strings.summaryToggle}
            </span>
            <span className="font-serif text-[18px] tabular-nums">
              {eur0(estimate.lowCents)}–{eur0(estimate.highCents)}
            </span>
          </button>
          <AnimatePresence>
            {mobileSummaryOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
                  {SummaryBody}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text) disabled:opacity-30"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
            {strings.back}
          </button>
          {stepIdx < total - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-5 py-2.5 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90"
            >
              {strings.next}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !stepValid}
              className="shadow-glow inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-(--color-accent)/90 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {strings.submitting}
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {strings.submit}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Desktop: sticky samenvatting */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
          {SummaryBody}
        </div>
      </aside>
    </div>
  );
}

function StepShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-[clamp(24px,3.5vw,34px)] leading-tight">{title}</h2>
      <p className="mt-2 max-w-prose text-[15px] text-(--color-muted)">{lede}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function FieldInput({
  label,
  required,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
        {label}
        {required ? <span className="ml-1 text-(--color-accent)">·</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
      />
    </label>
  );
}
