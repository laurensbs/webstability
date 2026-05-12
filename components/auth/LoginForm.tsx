"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { signInAction, checkUserExists, loginWithPassword } from "@/app/actions/auth";
import { useRouter, Link } from "@/i18n/navigation";

type StateCopy = {
  /** Toon wanneer de user de email-field heeft verlaten en het adres
   * een bestaand account blijkt. */
  returning: string;
  /** Toon wanneer de user een nieuw email-adres invult. */
  fresh: string;
};

export function LoginForm({
  variant = "light",
  defaultEmail = "",
  stateCopy,
  redirectTo,
}: {
  variant?: "light" | "dark";
  /** Pre-fill van de email-veld, bijv. ?email=…&from=checkout. */
  defaultEmail?: string;
  /** Optioneel: 3-state copy (returning / fresh) voor de klant-flow.
   * Op admin-host laat je dit weg en blijft het formulier neutraal. */
  stateCopy?: StateCopy;
  /** Waarheen na een geslaagde wachtwoord-login (default /portal/dashboard). */
  redirectTo?: string;
}) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [userState, setUserState] = useState<"unknown" | "returning" | "fresh">("unknown");
  const lastChecked = useRef<string>("");
  const dark = variant === "dark";

  async function probeEmail(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setUserState("unknown");
      return;
    }
    if (lastChecked.current === trimmed) return;
    lastChecked.current = trimmed;
    try {
      const res = await checkUserExists(trimmed);
      setUserState(res.exists ? "returning" : "fresh");
    } catch {
      setUserState("unknown");
    }
  }

  const labelClass = `text-sm font-medium ${dark ? "text-(--color-bg)" : "text-(--color-text)"}`;
  const inputClass =
    "mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)";
  const buttonClass = `flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-60 ${
    dark ? "bg-(--color-accent) text-white" : "bg-(--color-text) text-(--color-bg)"
  }`;
  const spinner = (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );

  // --- Wachtwoord-login ---
  if (mode === "password") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.set("email", email);
            fd.set("password", password);
            const res = await loginWithPassword(null, fd);
            if (res.ok) {
              router.push((redirectTo ?? "/portal/dashboard") as never);
            } else {
              setError(res.error === "invalid_credentials" ? t("invalidCredentials") : t("error"));
            }
          });
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className={labelClass}>{t("emailLabel")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus={!defaultEmail}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("passwordLabel")}</span>
          <div className="relative mt-2">
            <input
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 pr-10 text-(--color-text) outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-(--color-muted) hover:text-(--color-text)"
              aria-label={showPw ? t("hidePassword") : t("showPassword")}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? (
            <>
              {spinner}
              <span>{t("loginSubmit")}</span>
            </>
          ) : (
            t("loginSubmit")
          )}
        </button>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm ${dark ? "text-white" : "text-(--color-accent)"}`}
          >
            {error}
          </motion.p>
        ) : null}

        <div
          className={`flex flex-wrap items-center justify-between gap-2 pt-1 text-[13px] ${
            dark ? "text-(--color-bg)/60" : "text-(--color-muted)"
          }`}
        >
          <Link
            href={{ pathname: "/forgot-password", query: email ? { email } : undefined } as never}
            className={dark ? "hover:text-(--color-bg)" : "hover:text-(--color-text)"}
          >
            {t("forgotPassword")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("magic");
            }}
            className={dark ? "hover:text-(--color-bg)" : "hover:text-(--color-text)"}
          >
            {t("useMagicLink")}
          </button>
        </div>
      </form>
    );
  }

  // --- Magic-link login (e-mailadres → inloglink) ---
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        try {
          sessionStorage.setItem("wb:pending-email", email);
        } catch {
          // private mode — /verify falls back to a generic line.
        }
        startTransition(async () => {
          const res = await signInAction(email, name);
          if (res?.error) setError(t("error"));
        });
      }}
      className="space-y-4"
    >
      {stateCopy ? (
        <AnimatePresence mode="wait">
          {userState !== "unknown" ? (
            <motion.div
              key={userState}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className={`rounded-lg border px-4 py-3 text-[13px] leading-snug ${
                userState === "returning"
                  ? dark
                    ? "border-(--color-success)/40 bg-(--color-success)/15 text-(--color-bg)"
                    : "border-(--color-success)/40 bg-(--color-success)/10 text-(--color-text)"
                  : dark
                    ? "border-(--color-accent)/40 bg-(--color-accent)/15 text-(--color-bg)"
                    : "border-(--color-accent)/40 bg-(--color-accent-soft) text-(--color-text)"
              }`}
            >
              {userState === "returning" ? stateCopy.returning : stateCopy.fresh}
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      <label className="block">
        <span className={labelClass}>{t("nameLabel")}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
        <span
          className={`mt-1 block text-[11px] ${dark ? "text-(--color-bg)/55" : "text-(--color-muted)"}`}
        >
          {t("nameHint")}
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>{t("emailLabel")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => {
            if (stateCopy) void probeEmail(e.target.value);
          }}
          autoComplete="email"
          autoFocus={!defaultEmail}
          className={inputClass}
        />
      </label>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? (
          <>
            {spinner}
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

      <div className={`pt-1 text-[13px] ${dark ? "text-(--color-bg)/60" : "text-(--color-muted)"}`}>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode("password");
          }}
          className={dark ? "hover:text-(--color-bg)" : "hover:text-(--color-text)"}
        >
          {t("usePassword")}
        </button>
      </div>
    </form>
  );
}
