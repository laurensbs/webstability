"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";

type Strings = {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  sentTitle: string;
  sentBody: string;
};

export function ForgotPasswordForm({
  defaultEmail = "",
  strings,
}: {
  defaultEmail?: string;
  strings: Strings;
}) {
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent)/15 text-(--color-accent)">
          <MailCheck className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h1 className="text-h3">{strings.sentTitle}</h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-(--color-muted)">{strings.sentBody}</p>
      </div>
    );
  }

  async function action(formData: FormData) {
    // Antwoord is altijd ok (geen account-enumeratie) — toon altijd "verstuurd".
    await requestPasswordReset(null, formData);
    setSent(true);
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-(--color-text)">{strings.emailLabel}</span>
        <input
          type="email"
          name="email"
          defaultValue={defaultEmail}
          placeholder={strings.emailPlaceholder}
          autoComplete="email"
          required
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>
      <Submit submit={strings.submit} submitting={strings.submitting} />
    </form>
  );
}

function Submit({ submit, submitting }: { submit: string; submitting: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-(--color-text) px-4 py-2.5 text-sm font-medium text-(--color-bg) transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? submitting : submit}
    </button>
  );
}
