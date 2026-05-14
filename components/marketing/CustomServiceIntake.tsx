"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitCustomIntake, type CustomServiceKind } from "@/app/actions/custom-intake";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

/**
 * Eenvoudig intake-formulier voor de vier maatwerk-verticals (verhuur,
 * klantportaal, reparatie, admin-systeem) waar een richtprijs uit een
 * formulier niet werkt. Vraagt naam, e-mail, optioneel bedrijfsnaam en
 * een korte beschrijving. Na submit: bedankscherm + Cal-popup voor het
 * gesprek.
 *
 * State-machine: form → submitting → success. Honeypot (`website_url`)
 * is hidden + aria-hidden zodat alleen bots 'm invullen.
 */

export type CustomServiceIntakeStrings = {
  // Header per kind (label uit ServicePicker)
  kindLabel: string;
  // Sub-uitleg waarom geen vaste prijs
  kindLede: string;
  // Form labels
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  companyLabel: string;
  companyPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  // Acties
  back: string;
  submit: string;
  submitting: string;
  // Success
  successTitle: string;
  successBody: string;
  successCta: string;
  // Errors (toast)
  errorMissing: string;
  errorEmail: string;
  errorRate: string;
  errorGeneric: string;
};

export function CustomServiceIntake({
  kind,
  locale,
  strings,
  onBack,
}: {
  kind: CustomServiceKind;
  locale: string;
  strings: CustomServiceIntakeStrings;
  onBack: () => void;
}) {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success">("idle");
  const honeypotRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("submitting");

    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    fd.set("locale", locale);
    fd.set("website_url", honeypotRef.current?.value ?? "");

    const result = await submitCustomIntake(fd);
    if (result.ok) {
      setStatus("success");
    } else if (result.error === "spam") {
      // Liegen tegen bots — UI ziet er als success uit, geen DB-write gebeurd
      setStatus("success");
    } else {
      setStatus("idle");
      const msg =
        result.error === "missing_fields"
          ? strings.errorMissing
          : result.error === "invalid_email"
            ? strings.errorEmail
            : result.error === "rate_limited"
              ? strings.errorRate
              : strings.errorGeneric;
      toast.error(msg);
    }
  }

  return (
    <div className="rounded-modal mx-auto max-w-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
      >
        <ArrowLeft className="h-3 w-3" />
        {strings.back}
      </button>

      <AnimatePresence mode="wait">
        {status !== "success" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-6"
          >
            <div>
              <h2 className="font-serif text-2xl text-(--color-text)">{strings.kindLabel}</h2>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-(--color-muted)">
                {strings.kindLede}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <div
                aria-hidden
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
              >
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website_url"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={strings.nameLabel}
                  name="name"
                  placeholder={strings.namePlaceholder}
                  required
                />
                <Field
                  label={strings.emailLabel}
                  name="email"
                  type="email"
                  placeholder={strings.emailPlaceholder}
                  required
                />
              </div>
              <Field
                label={strings.companyLabel}
                name="company"
                placeholder={strings.companyPlaceholder}
              />
              <Field
                label={strings.messageLabel}
                name="message"
                placeholder={strings.messagePlaceholder}
                required
                multiline
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {strings.submitting}
                    </>
                  ) : (
                    <>
                      {strings.submit}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-5 text-center"
          >
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-(--color-text)">{strings.successTitle}</h2>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-(--color-muted)">
                {strings.successBody}
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <CalPopupTrigger
                locale={locale}
                className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
              >
                {strings.successCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </CalPopupTrigger>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  multiline = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        {label}
        {required ? " *" : ""}
      </span>
      {multiline ? (
        <textarea
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className="mt-1 w-full resize-y rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[14px] text-(--color-text) focus:border-(--color-accent) focus:outline-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[14px] text-(--color-text) focus:border-(--color-accent) focus:outline-none"
        />
      )}
    </label>
  );
}
