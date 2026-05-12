"use client";

import * as React from "react";
import { KeyRound, Loader2 } from "lucide-react";

export function UnlockForm({ error }: { error?: boolean }) {
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <form
      method="POST"
      action="/strategie/unlock"
      onSubmit={() => setSubmitting(true)}
      className="w-full max-w-sm space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="strategie-password"
          className="block font-mono text-[11px] tracking-widest text-(--color-bg)/60 uppercase"
        >
          Wachtwoord
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-(--color-bg)/40" />
          <input
            id="strategie-password"
            name="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            required
            className="w-full rounded-full border border-(--color-bg)/15 bg-(--color-bg)/5 py-3 pr-4 pl-10 font-mono text-sm text-(--color-bg) placeholder:text-(--color-bg)/30 focus:border-(--color-accent)/60 focus:bg-(--color-bg)/10 focus:outline-none"
            placeholder="••••••••••"
          />
        </div>
        {error ? (
          <p className="font-mono text-[11px] tracking-wide text-(--color-accent)">
            Verkeerd wachtwoord. Probeer opnieuw.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="shadow-glow hover:shadow-glow inline-flex w-full items-center justify-center gap-2 rounded-full bg-(--color-accent) px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-(--color-accent)/90 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ontgrendelen…
          </>
        ) : (
          "Ontgrendelen"
        )}
      </button>
    </form>
  );
}
