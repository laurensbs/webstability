"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Calendar, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { saveIntakeDraft, submitIntakeForm } from "@/app/actions/intake";
import { ConfettiBurst } from "@/components/animate/ConfettiBurst";

type StepKey =
  | "company"
  | "build"
  | "audience"
  | "current"
  | "musthaves"
  | "branding"
  | "integrations"
  | "call";

type Answers = {
  company?: { name?: string; vat?: string; website?: string; pitch?: string };
  build?: { type?: string; details?: string };
  audience?: { audience?: string; market?: string; languages?: string[] };
  current?: { tools?: string[]; frustration?: string };
  musthaves?: { features?: string[] };
  branding?: { hasBranding?: string; vibe?: string; logoUrl?: string };
  integrations?: { integrations?: string[]; other?: string };
  call?: { startsAt?: string; calMeetingId?: string; meetingUrl?: string; note?: string };
};

type StepDef = {
  key: StepKey;
  label: string;
  title: string;
  lede: string;
  fields: Record<string, unknown>;
};

type Strings = {
  eyebrow: string;
  title: string;
  lede: string;
  progressLabel: string;
  saveAndClose: string;
  next: string;
  back: string;
  submit: string;
  submitting: string;
  savedDraft: string;
  submittedTitle: string;
  submittedBody: string;
  submittedCta: string;
  steps: StepDef[];
  validation: {
    required: string;
    tooLong: string;
    fileTooLarge: string;
    tooManyChecked: string;
  };
};

/**
 * Multistep intake-form. Klant doorloopt 8 stappen, kan tussentijds
 * opslaan ('Sla op en sluit'), kan terug naar vorige stap. Bij submit:
 * server-action `submitIntakeForm` doet validatie + project-spawn +
 * booking-create + audit-log + staff-notify mail.
 *
 * Mobile-first: één vraag per scherm, grote touch-targets, voortgangs-
 * bar bovenaan. Op desktop blijft de layout rustig — geen multi-column,
 * de focus is altijd op de huidige vraag.
 */
export function IntakeForm({
  strings,
  initialAnswers,
  initialStep,
  dashboardHref,
}: {
  strings: Strings;
  initialAnswers: Answers;
  initialStep: number;
  dashboardHref: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Answers>(initialAnswers);
  const [stepIndex, setStepIndex] = React.useState(
    Math.max(0, Math.min(strings.steps.length - 1, initialStep - 1)),
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const totalSteps = strings.steps.length;
  const step = strings.steps[stepIndex]!;
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  // "Volgende" pas actief als de verplichte velden van déze stap ingevuld
  // zijn (i.p.v. pas falen bij submit). Alleen 'company' (bedrijfsnaam),
  // 'build' (type) en 'call' (datum) hebben harde velden — de rest is vrij.
  const stepIsValid = ((): boolean => {
    switch (step.key) {
      case "company":
        return Boolean(answers.company?.name?.trim());
      case "build":
        return Boolean(answers.build?.type);
      case "call":
        return Boolean(answers.call?.startsAt);
      default:
        return true;
    }
  })();

  const update = <K extends StepKey>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...value } }));
  };

  const persistDraft = async (nextStepIndex: number) => {
    setSaving(true);
    const fd = new FormData();
    fd.set("answers", JSON.stringify(answers));
    fd.set("currentStep", String(nextStepIndex + 1));
    try {
      const result = await saveIntakeDraft(fd);
      if (!result.ok) {
        toast.error("Concept niet opgeslagen — probeer opnieuw.");
      }
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (stepIndex >= totalSteps - 1) return;
    const next = stepIndex + 1;
    setStepIndex(next);
    void persistDraft(next);
  };

  const goBack = () => {
    if (stepIndex <= 0) return;
    setStepIndex(stepIndex - 1);
  };

  const saveAndClose = async () => {
    await persistDraft(stepIndex);
    toast.success(strings.savedDraft);
    router.push(dashboardHref);
  };

  const submit = async () => {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("answers", JSON.stringify(answers));
    try {
      const result = await submitIntakeForm(fd);
      if (result.ok) {
        setDone(true);
      } else {
        toast.error(formatErrorKey(result.messageKey));
      }
    } catch {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return <SuccessScreen strings={strings} dashboardHref={dashboardHref} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Voortgangs-bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          <span>
            {strings.progressLabel
              .replace("{current}", String(stepIndex + 1))
              .replace("{total}", String(totalSteps))}
          </span>
          <button
            type="button"
            onClick={saveAndClose}
            disabled={saving}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-(--color-text) disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" strokeWidth={2.4} />
            )}
            {strings.saveAndClose}
          </button>
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
          key={step.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
            {"// "}
            {step.label}
          </p>
          <h2 className="mt-3 text-3xl leading-tight md:text-4xl">{step.title}</h2>
          <p className="mt-3 text-(--color-muted)">{step.lede}</p>

          <div className="mt-8 space-y-5">
            <StepFields step={step} answers={answers} update={update} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text) disabled:opacity-30"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
          {strings.back}
        </button>
        {stepIndex < totalSteps - 1 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!stepIsValid}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-5 py-2.5 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90 disabled:opacity-40"
          >
            {strings.next}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !stepIsValid}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] transition-colors hover:bg-(--color-accent)/90 disabled:opacity-60"
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
  );
}

function StepFields({
  step,
  answers,
  update,
}: {
  step: StepDef;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  switch (step.key) {
    case "company":
      return (
        <CompanyStep fields={step.fields as CompanyFields} answers={answers} update={update} />
      );
    case "build":
      return <BuildStep fields={step.fields as BuildFields} answers={answers} update={update} />;
    case "audience":
      return (
        <AudienceStep fields={step.fields as AudienceFields} answers={answers} update={update} />
      );
    case "current":
      return (
        <CurrentStep fields={step.fields as CurrentFields} answers={answers} update={update} />
      );
    case "musthaves":
      return (
        <MusthavesStep fields={step.fields as MusthavesFields} answers={answers} update={update} />
      );
    case "branding":
      return (
        <BrandingStep fields={step.fields as BrandingFields} answers={answers} update={update} />
      );
    case "integrations":
      return (
        <IntegrationsStep
          fields={step.fields as IntegrationsFields}
          answers={answers}
          update={update}
        />
      );
    case "call":
      return <CallStep fields={step.fields as CallFields} answers={answers} update={update} />;
    default:
      return null;
  }
}

// --- step components -----------------------------------------------------

type CompanyFields = {
  companyName: string;
  companyNamePlaceholder: string;
  vat: string;
  vatPlaceholder: string;
  website: string;
  websitePlaceholder: string;
  pitch: string;
  pitchPlaceholder: string;
};

function CompanyStep({
  fields,
  answers,
  update,
}: {
  fields: CompanyFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.company ?? {};
  return (
    <>
      <Field label={fields.companyName} required>
        <input
          type="text"
          value={v.name ?? ""}
          onChange={(e) => update("company", { name: e.target.value })}
          placeholder={fields.companyNamePlaceholder}
          className="block min-h-12 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
          required
        />
      </Field>
      <Field label={fields.vat}>
        <input
          type="text"
          value={v.vat ?? ""}
          onChange={(e) => update("company", { vat: e.target.value })}
          placeholder={fields.vatPlaceholder}
          className="block min-h-12 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
      <Field label={fields.website}>
        <input
          type="url"
          value={v.website ?? ""}
          onChange={(e) => update("company", { website: e.target.value })}
          placeholder={fields.websitePlaceholder}
          className="block min-h-12 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
      <Field label={fields.pitch}>
        <textarea
          value={v.pitch ?? ""}
          onChange={(e) => update("company", { pitch: e.target.value })}
          placeholder={fields.pitchPlaceholder}
          rows={3}
          className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
    </>
  );
}

type BuildFields = {
  type: string;
  typeOptions: Record<string, string>;
  details: string;
  detailsPlaceholder: string;
};

function BuildStep({
  fields,
  answers,
  update,
}: {
  fields: BuildFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.build ?? {};
  return (
    <>
      <Field label={fields.type} required>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(fields.typeOptions).map(([value, label]) => (
            <RadioCard
              key={value}
              name="build-type"
              value={value}
              checked={v.type === value}
              onChange={() => update("build", { type: value })}
              label={label}
            />
          ))}
        </div>
      </Field>
      <Field label={fields.details}>
        <textarea
          value={v.details ?? ""}
          onChange={(e) => update("build", { details: e.target.value })}
          placeholder={fields.detailsPlaceholder}
          rows={3}
          className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
    </>
  );
}

type AudienceFields = {
  audience: string;
  audiencePlaceholder: string;
  market: string;
  marketOptions: Record<string, string>;
  languages: string;
  languagesOptions: Record<string, string>;
};

function AudienceStep({
  fields,
  answers,
  update,
}: {
  fields: AudienceFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.audience ?? {};
  const langs = v.languages ?? [];
  return (
    <>
      <Field label={fields.audience}>
        <textarea
          value={v.audience ?? ""}
          onChange={(e) => update("audience", { audience: e.target.value })}
          placeholder={fields.audiencePlaceholder}
          rows={3}
          className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
      <Field label={fields.market}>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(fields.marketOptions).map(([value, label]) => (
            <RadioCard
              key={value}
              name="market"
              value={value}
              checked={v.market === value}
              onChange={() => update("audience", { market: value })}
              label={label}
            />
          ))}
        </div>
      </Field>
      <Field label={fields.languages}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(fields.languagesOptions).map(([value, label]) => (
            <CheckboxPill
              key={value}
              checked={langs.includes(value)}
              onChange={() => {
                const next = langs.includes(value)
                  ? langs.filter((l) => l !== value)
                  : [...langs, value];
                update("audience", { languages: next });
              }}
              label={label}
            />
          ))}
        </div>
      </Field>
    </>
  );
}

type CurrentFields = {
  tools: string;
  toolsOptions: Record<string, string>;
  frustration: string;
  frustrationPlaceholder: string;
};

function CurrentStep({
  fields,
  answers,
  update,
}: {
  fields: CurrentFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.current ?? {};
  const tools = v.tools ?? [];
  return (
    <>
      <Field label={fields.tools}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(fields.toolsOptions).map(([value, label]) => (
            <CheckboxPill
              key={value}
              checked={tools.includes(value)}
              onChange={() => {
                const next = tools.includes(value)
                  ? tools.filter((t) => t !== value)
                  : [...tools, value];
                update("current", { tools: next });
              }}
              label={label}
            />
          ))}
        </div>
      </Field>
      <Field label={fields.frustration}>
        <textarea
          value={v.frustration ?? ""}
          onChange={(e) => update("current", { frustration: e.target.value })}
          placeholder={fields.frustrationPlaceholder}
          rows={4}
          className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
    </>
  );
}

type MusthavesFields = {
  features: string;
  featuresOptions: Record<string, string>;
};

function MusthavesStep({
  fields,
  answers,
  update,
}: {
  fields: MusthavesFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const features = answers.musthaves?.features ?? [];
  const max = 5;
  return (
    <Field label={fields.features}>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(fields.featuresOptions).map(([value, label]) => {
          const checked = features.includes(value);
          const disabled = !checked && features.length >= max;
          return (
            <CheckboxCard
              key={value}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                const next = checked ? features.filter((f) => f !== value) : [...features, value];
                update("musthaves", { features: next });
              }}
              label={label}
            />
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {features.length} / {max}
      </p>
    </Field>
  );
}

type BrandingFields = {
  hasBranding: string;
  hasBrandingOptions: Record<string, string>;
  logoUpload: string;
  vibe: string;
  vibeOptions: Record<string, string>;
};

function BrandingStep({
  fields,
  answers,
  update,
}: {
  fields: BrandingFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.branding ?? {};
  return (
    <>
      <Field label={fields.hasBranding}>
        <div className="grid gap-2">
          {Object.entries(fields.hasBrandingOptions).map(([value, label]) => (
            <RadioCard
              key={value}
              name="has-branding"
              value={value}
              checked={v.hasBranding === value}
              onChange={() => update("branding", { hasBranding: value })}
              label={label}
            />
          ))}
        </div>
      </Field>
      <Field label={fields.vibe}>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(fields.vibeOptions).map(([value, label]) => (
            <RadioCard
              key={value}
              name="vibe"
              value={value}
              checked={v.vibe === value}
              onChange={() => update("branding", { vibe: value })}
              label={label}
            />
          ))}
        </div>
      </Field>
    </>
  );
}

type IntegrationsFields = {
  integrations: string;
  integrationsOptions: Record<string, string>;
  other: string;
  otherPlaceholder: string;
};

function IntegrationsStep({
  fields,
  answers,
  update,
}: {
  fields: IntegrationsFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.integrations ?? {};
  const ints = v.integrations ?? [];
  return (
    <>
      <Field label={fields.integrations}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(fields.integrationsOptions).map(([value, label]) => (
            <CheckboxPill
              key={value}
              checked={ints.includes(value)}
              onChange={() => {
                const next = ints.includes(value)
                  ? ints.filter((i) => i !== value)
                  : [...ints, value];
                update("integrations", { integrations: next });
              }}
              label={label}
            />
          ))}
        </div>
      </Field>
      <Field label={fields.other}>
        <input
          type="text"
          value={v.other ?? ""}
          onChange={(e) => update("integrations", { other: e.target.value })}
          placeholder={fields.otherPlaceholder}
          className="block min-h-12 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
    </>
  );
}

type CallFields = {
  calLabel: string;
  calNotePlaceholder: string;
  calConfirmation: string;
  calOpen: string;
};

function CallStep({
  fields,
  answers,
  update,
}: {
  fields: CallFields;
  answers: Answers;
  update: <K extends StepKey>(key: K, value: Answers[K]) => void;
}) {
  const v = answers.call ?? {};

  // Cal.com embed: voor MVP gebruiken we een datetime-local input zodat
  // de klant zelf datum + tijd kan kiezen. Fase 2 vervangt dit door een
  // echte Cal.com-embed waar Cal de slot-availability beheert. De
  // datetime-input zorgt nu al dat we een geldige `startsAt` Date
  // kunnen opslaan zonder externe afhankelijkheid.
  const [localValue, setLocalValue] = React.useState(() => {
    if (!v.startsAt) return "";
    const d = new Date(v.startsAt);
    if (Number.isNaN(d.getTime())) return "";
    // datetime-local format: YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const onPick = (val: string) => {
    setLocalValue(val);
    if (!val) {
      update("call", { startsAt: undefined });
      return;
    }
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return;
    update("call", { startsAt: d.toISOString() });
  };

  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Field label={fields.calLabel} required>
        <div className="rounded-[14px] border border-(--color-border) bg-(--color-bg-warm) p-5">
          <label className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-(--color-accent)" strokeWidth={2.2} />
            <input
              type="datetime-local"
              value={localValue}
              onChange={(e) => onPick(e.target.value)}
              className="flex-1 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[14px] focus:border-(--color-accent)/60 focus:outline-none"
              required
            />
          </label>
          {v.startsAt ? (
            <p className="mt-3 font-mono text-[11px] tracking-wide text-(--color-accent) uppercase">
              ✓ {fields.calConfirmation.replace("{datetime}", dateFmt.format(new Date(v.startsAt)))}
            </p>
          ) : null}
        </div>
      </Field>
      <Field label="">
        <textarea
          value={v.note ?? ""}
          onChange={(e) => update("call", { note: e.target.value })}
          placeholder={fields.calNotePlaceholder}
          rows={3}
          className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[15px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </Field>
    </>
  );
}

// --- shared field helpers -------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
          {label}
          {required ? <span className="ml-1 text-(--color-accent)">·</span> : null}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 text-[14px] transition-colors ${
        checked
          ? "border-(--color-accent) bg-(--color-accent-soft)/40 text-(--color-text)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-accent)/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-(--color-accent)"
      />
      <span className={checked ? "font-medium" : ""}>{label}</span>
    </label>
  );
}

function CheckboxCard({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 text-[14px] transition-colors ${
        checked
          ? "border-(--color-accent) bg-(--color-accent-soft)/40 text-(--color-text)"
          : disabled
            ? "cursor-not-allowed border-(--color-border) bg-(--color-surface) text-(--color-muted)/50 opacity-60"
            : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-accent)/40"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 accent-(--color-accent)"
      />
      <span className={checked ? "font-medium" : ""}>{label}</span>
    </label>
  );
}

function CheckboxPill({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
        checked
          ? "border-(--color-accent) bg-(--color-accent) text-white"
          : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-accent)/40 hover:text-(--color-text)"
      }`}
    >
      {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      {label}
    </button>
  );
}

function SuccessScreen({ strings, dashboardHref }: { strings: Strings; dashboardHref: string }) {
  const [fire, setFire] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setFire(true), 350);
    const r = window.setTimeout(() => setFire(false), 2000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(r);
    };
  }, []);
  return (
    <div className="relative mx-auto max-w-2xl text-center">
      <ConfettiBurst fire={fire} anchor="top" variant="success" />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-(--color-accent)/15 text-(--color-accent)"
      >
        <Check className="h-8 w-8" strokeWidth={2.4} />
      </motion.div>
      <h2 className="mt-8 text-3xl leading-tight md:text-4xl">{strings.submittedTitle}</h2>
      <p className="mt-4 text-(--color-muted)">{strings.submittedBody}</p>
      <a
        href={dashboardHref}
        className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-5 py-2.5 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90"
      >
        {strings.submittedCta}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}

function formatErrorKey(key: string): string {
  switch (key) {
    case "missing_company_name":
      return "Vul een bedrijfsnaam in (stap 1).";
    case "missing_build_type":
      return "Kies een build-type (stap 2).";
    case "missing_welcome_call":
      return "Plan eerst de welkom-call (stap 8).";
    case "invalid_call_date":
      return "De gekozen datum kon niet worden begrepen.";
    case "demo_readonly":
      return "Demo-modus — formulier wordt niet verstuurd.";
    default:
      return "Er ging iets mis. Probeer het opnieuw.";
  }
}
