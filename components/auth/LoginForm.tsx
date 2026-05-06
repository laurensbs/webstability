"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { signInAction } from "@/app/actions/auth";

export function LoginForm({
  variant = "light",
  defaultEmail = "",
}: {
  variant?: "light" | "dark";
  /** Pre-fill van de email-veld, bijv. ?email=…&from=checkout. */
  defaultEmail?: string;
}) {
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dark = variant === "dark";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        // Stash the email so /verify can show "we sent a link to <email>"
        // without an extra round-trip. Same-tab only, cleared in /verify
        // once read. Never persisted across sessions.
        try {
          sessionStorage.setItem("wb:pending-email", email);
        } catch {
          // private mode or disabled storage — /verify falls back to a
          // generic line.
        }
        startTransition(async () => {
          const res = await signInAction(email, name);
          if (res?.error) setError(t("error"));
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span
          className={`text-sm font-medium ${dark ? "text-(--color-bg)" : "text-(--color-text)"}`}
        >
          {t("nameLabel")}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
        <span
          className={`mt-1 block text-[11px] ${dark ? "text-(--color-bg)/55" : "text-(--color-muted)"}`}
        >
          {t("nameHint")}
        </span>
      </label>

      <label className="block">
        <span
          className={`text-sm font-medium ${dark ? "text-(--color-bg)" : "text-(--color-text)"}`}
        >
          {t("emailLabel")}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus={!defaultEmail}
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-60 ${
          dark ? "bg-(--color-accent) text-white" : "bg-(--color-text) text-(--color-bg)"
        }`}
      >
        {pending ? (
          <>
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span>{t("submit")}</span>
          </>
        ) : (
          t("submit")
        )}
      </button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-(--color-accent)"
        >
          {error}
        </motion.p>
      )}
    </form>
  );
}
