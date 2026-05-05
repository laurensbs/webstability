"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

/**
 * Submit button that automatically wires `loading` to the parent form's
 * pending state via `useFormStatus`. Drop this inside any `<form>` (or
 * the ToastForm wrapper) and it'll show a spinner while the action runs.
 */
export function SubmitButton(props: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" loading={pending} />;
}
