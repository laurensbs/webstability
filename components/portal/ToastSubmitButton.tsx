"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { useToastFormStatus } from "@/components/portal/ToastForm";

/**
 * Submit button that reads pending state from the surrounding ToastForm.
 * Use as a drop-in replacement for `<Button type="submit">` inside any
 * ToastForm and you'll get a spinner + disabled state for free while the
 * server action runs.
 */
export function ToastSubmitButton(props: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useToastFormStatus();
  return <Button {...props} type="submit" loading={pending} />;
}
