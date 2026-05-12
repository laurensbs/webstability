"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type Strings = {
  step: string; // "Stap {n} van 3"
  step1Heading: string;
  step1Lede: string;
  nameLabel: string;
  namePlaceholder: string;
  countryLabel: string;
  vatLabel: string;
  vatPlaceholder: string;
  step2Heading: string;
  step2Lede: string;
  ownerNameLabel: string;
  ownerNamePlaceholder: string;
  ownerEmailLabel: string;
  ownerEmailPlaceholder: string;
  step3Heading: string;
  step3Lede: string;
  planLabel: string;
  planNone: string;
  planCare: string;
  planStudio: string;
  planAtelier: string;
  back: string;
  next: string;
  submit: string;
};

/**
 * 3-step wizard voor het aanmaken van een nieuwe klant + owner-user.
 * State leeft client-side tot stap 3; bij submit gaat alles in één
 * server-action `createOrgWithOwner`. Tussenstappen valideren minimaal
 * (alleen "leeg of niet leeg"); echte validatie (slug-uniek, email-format)
 * gebeurt server-side.
 */
export function OrgWizard({
  action,
  strings,
  prefill,
  hidden,
}: {
  action: Action;
  strings: Strings;
  /** Voorgevulde velden — bv. vanuit een configurator-lead
   * (/admin/orgs/new?name=…&email=…). Optioneel. */
  prefill?: { name?: string; ownerName?: string; ownerEmail?: string };
  /** Extra verborgen velden die ongewijzigd naar de server-action gaan —
   * bv. `projectType` + `leadId` vanuit een configurator-lead. */
  hidden?: Record<string, string>;
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  // Form-state in client-state zodat tussen stap 1→2→3 niet verloren gaat
  // bij re-render. Submit-stap renderet alle 3 sets als hidden inputs.
  const [name, setName] = React.useState(prefill?.name ?? "");
  const [country, setCountry] = React.useState<"NL" | "ES">("NL");
  const [vatNumber, setVatNumber] = React.useState("");
  const [ownerName, setOwnerName] = React.useState(prefill?.ownerName ?? "");
  const [ownerEmail, setOwnerEmail] = React.useState(prefill?.ownerEmail ?? "");
  const [plan, setPlan] = React.useState<"" | "care" | "studio" | "atelier">("");

  const canNext1 = name.trim().length >= 2;
  const canNext2 = ownerEmail.trim() === "" || ownerEmail.trim().includes("@");
  // Stap 3 → submit altijd toegestaan (plan optioneel).

  return (
    <div className="rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8">
      {/* Progress-bar */}
      <div className="mb-6 flex items-center gap-2">
        <p className="font-mono text-[11px] tracking-[0.08em] text-(--color-wine)">
          {strings.step.replace("{n}", String(step))}
        </p>
        <div className="ml-auto flex items-center gap-1.5" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                step >= n ? "bg-(--color-wine)" : "bg-(--color-border)"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 ? (
            <Step1
              strings={strings}
              name={name}
              setName={setName}
              country={country}
              setCountry={setCountry}
              vatNumber={vatNumber}
              setVatNumber={setVatNumber}
            />
          ) : null}
          {step === 2 ? (
            <Step2
              strings={strings}
              ownerName={ownerName}
              setOwnerName={setOwnerName}
              ownerEmail={ownerEmail}
              setOwnerEmail={setOwnerEmail}
            />
          ) : null}
          {step === 3 ? (
            <Step3 strings={strings} plan={plan} setPlan={setPlan} name={name} />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Footer-knoppen */}
      <footer className="mt-8 flex items-center justify-between gap-3 border-t border-(--color-border) pt-5">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-4 py-2 text-[13px] font-medium text-(--color-muted) hover:text-(--color-text)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {strings.back}
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !canNext1) return;
              if (step === 2 && !canNext2) return;
              setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
            }}
            disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) hover:opacity-90 disabled:opacity-50"
          >
            {strings.next}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ToastForm action={action}>
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="vatNumber" value={vatNumber} />
            <input type="hidden" name="ownerName" value={ownerName} />
            <input type="hidden" name="ownerEmail" value={ownerEmail} />
            <input type="hidden" name="plan" value={plan} />
            {hidden
              ? Object.entries(hidden).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))
              : null}
            <ToastSubmitButton variant="primary">
              {strings.submit}
              <ArrowRight className="h-3.5 w-3.5" />
            </ToastSubmitButton>
          </ToastForm>
        )}
      </footer>
    </div>
  );
}

function Step1({
  strings,
  name,
  setName,
  country,
  setCountry,
  vatNumber,
  setVatNumber,
}: {
  strings: Strings;
  name: string;
  setName: (s: string) => void;
  country: "NL" | "ES";
  setCountry: (c: "NL" | "ES") => void;
  vatNumber: string;
  setVatNumber: (s: string) => void;
}) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-serif text-2xl">{strings.step1Heading}</h2>
        <p className="mt-1 text-[14px] text-(--color-muted)">{strings.step1Lede}</p>
      </header>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">{strings.nameLabel}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={strings.namePlaceholder}
          required
          autoFocus
          className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px] outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">{strings.countryLabel}</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as "NL" | "ES")}
            className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
          >
            <option value="NL">Nederland</option>
            <option value="ES">España</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">{strings.vatLabel}</span>
          <input
            type="text"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder={strings.vatPlaceholder}
            className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
          />
        </label>
      </div>
    </div>
  );
}

function Step2({
  strings,
  ownerName,
  setOwnerName,
  ownerEmail,
  setOwnerEmail,
}: {
  strings: Strings;
  ownerName: string;
  setOwnerName: (s: string) => void;
  ownerEmail: string;
  setOwnerEmail: (s: string) => void;
}) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-serif text-2xl">{strings.step2Heading}</h2>
        <p className="mt-1 text-[14px] text-(--color-muted)">{strings.step2Lede}</p>
      </header>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">{strings.ownerNameLabel}</span>
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder={strings.ownerNamePlaceholder}
          autoFocus
          className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">{strings.ownerEmailLabel}</span>
        <input
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder={strings.ownerEmailPlaceholder}
          className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
        />
      </label>
    </div>
  );
}

function Step3({
  strings,
  plan,
  setPlan,
  name,
}: {
  strings: Strings;
  plan: "" | "care" | "studio" | "atelier";
  setPlan: (p: "" | "care" | "studio" | "atelier") => void;
  name: string;
}) {
  const tiers: Array<{ id: "" | "care" | "studio" | "atelier"; label: string; sub?: string }> = [
    { id: "", label: strings.planNone, sub: "—" },
    { id: "care", label: strings.planCare, sub: "€95/m" },
    { id: "studio", label: strings.planStudio, sub: "€179/m" },
    { id: "atelier", label: strings.planAtelier, sub: "€399/m" },
  ];
  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-serif text-2xl">{strings.step3Heading.replace("{name}", name)}</h2>
        <p className="mt-1 text-[14px] text-(--color-muted)">{strings.step3Lede}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiers.map((t) => {
          const isActive = plan === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlan(t.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive
                  ? "border-(--color-wine) bg-(--color-wine)/5 text-(--color-text)"
                  : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)/40"
              }`}
            >
              <p className="text-[14px] font-medium">{t.label}</p>
              {t.sub ? (
                <p className="mt-0.5 font-mono text-[11px] text-(--color-muted)">{t.sub}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
