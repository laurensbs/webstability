"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { signInAction } from "@/app/actions/auth";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await signInAction(email);
          if (res?.error) setError(t("error"));
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium text-(--color-text)">{t("emailLabel")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-(--color-text) px-4 py-2.5 font-medium text-(--color-bg) transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "…" : t("submit")}
      </button>

      {error && <p className="text-sm text-(--color-accent)">{error}</p>}
    </form>
  );
}
