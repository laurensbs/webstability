"use client";

import * as React from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

const ToastFormContext = React.createContext<{ pending: boolean }>({ pending: false });

/**
 * Use inside a `<ToastForm>` to read the pending state so a submit button
 * can render a spinner. Returns `{ pending: false }` when used outside,
 * which means it's safe to call unconditionally.
 */
export function useToastFormStatus() {
  return React.useContext(ToastFormContext);
}

export function ToastForm({
  action,
  resetOnSuccess = false,
  className,
  children,
  onSuccess,
}: {
  action: Action;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
  /** Optionele callback bij succes (state.ok === true) — voor
   * confetti-trigger of andere knipogen. Krijgt de messageKey mee. */
  onSuccess?: (messageKey: string) => void;
}) {
  const t = useTranslations("portal.toasts");
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const lastShownRef = React.useRef(state);

  React.useEffect(() => {
    if (state === lastShownRef.current) return;
    lastShownRef.current = state;
    if (!state) return;
    const key = state.messageKey ?? (state.ok ? "saved" : "generic_error");
    // Translation lookup with fallback to a generic message.
    let msg: string;
    try {
      msg = t(key);
    } catch {
      msg = t("generic_error");
    }
    if (state.ok) {
      toast.success(msg);
      if (resetOnSuccess) formRef.current?.reset();
      const k = state.messageKey ?? "saved";
      onSuccess?.(k);
    } else {
      toast.error(msg);
    }
  }, [state, t, resetOnSuccess, onSuccess]);

  const ctx = React.useMemo(() => ({ pending }), [pending]);

  return (
    <ToastFormContext.Provider value={ctx}>
      <form
        ref={formRef}
        action={formAction}
        className={className}
        data-pending={pending ? "true" : undefined}
      >
        {children}
      </form>
    </ToastFormContext.Provider>
  );
}
