import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

export function StatusBanner({
  healthy,
  message,
  cta,
  ctaHref = "/status",
}: {
  healthy: boolean;
  message: string;
  cta: string;
  ctaHref?: Href;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${
        healthy
          ? "border-(--color-success)/30 bg-(--color-success)/5"
          : "border-(--color-accent)/40 bg-(--color-accent-soft)/40"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        {healthy ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-success)" />
          </>
        ) : (
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-wine)" />
        )}
      </span>
      <p className="flex-1 text-sm">{message}</p>
      {healthy ? (
        <CheckCircle2 className="hidden h-4 w-4 shrink-0 text-(--color-success) sm:block" />
      ) : (
        <AlertTriangle className="hidden h-4 w-4 shrink-0 text-(--color-wine) sm:block" />
      )}
      <Link
        href={ctaHref}
        className="hidden font-mono text-xs tracking-wide text-(--color-muted) hover:text-(--color-text) sm:inline"
      >
        {cta} →
      </Link>
    </div>
  );
}
