"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { setPasswordWithToken } from "@/app/actions/auth";
import { useRouter } from "@/i18n/navigation";

type Strings = {
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmLabel: string;
  submit: string;
  submitting: string;
  mismatch: string;
  tooShort: string;
  invalidToken: string;
  genericError: string;
  successTitle: string;
  successBody: string;
  goToLogin: string;
  minHint: string; // "Minimaal 8 tekens"
};

export function SetPasswordForm({ token, strings }: { token: string; strings: Strings }) {
  const router = useRouter();
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--color-success)/15 text-(--color-success)">
          <Check className="h-6 w-6" strokeWidth={2.4} />
        </div>
        <h1 className="text-h3">{strings.successTitle}</h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-(--color-muted)">{strings.successBody}</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[14px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
        >
          {strings.goToLogin}
        </button>
      </div>
    );
  }

  async function action(formData: FormData) {
    setError(null);
    if (pw.length < 8) {
      setError(strings.tooShort);
      return;
    }
    if (pw !== pw2) {
      setError(strings.mismatch);
      return;
    }
    formData.set("token", token);
    formData.set("password", pw);
    const res = await setPasswordWithToken(null, formData);
    if (res.ok) {
      setDone(true);
    } else if (res.error === "invalid_token") {
      setError(strings.invalidToken);
    } else if (res.error === "weak_password") {
      setError(strings.tooShort);
    } else {
      setError(strings.genericError);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-(--color-text)">{strings.passwordLabel}</span>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={strings.passwordPlaceholder}
            autoComplete="new-password"
            required
            minLength={8}
            className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 pr-10 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-(--color-muted) hover:text-(--color-text)"
            aria-label={show ? "verberg" : "toon"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <span className="mt-1 block text-[11px] text-(--color-muted)">{strings.minHint}</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-(--color-text)">{strings.confirmLabel}</span>
        <input
          type={show ? "text" : "password"}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>
      {error ? (
        <p className="rounded-md border border-(--color-wine)/30 bg-(--color-wine)/[0.06] px-3 py-2 text-[13px] text-(--color-text)">
          {error}
        </p>
      ) : null}
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
