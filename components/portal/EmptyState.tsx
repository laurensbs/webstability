import * as React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Empty-state placeholder. A small geometric mark (or any lucide icon
 * passed in) sits above a title + body. Designed for portal/admin list
 * surfaces where "0 items yet" needs to feel intentional, not broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-(--color-border) bg-(--color-surface)/50 px-6 py-14 text-center">
      <span className="relative inline-grid h-14 w-14 place-items-center rounded-full border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent)">
        {Icon ? (
          <Icon className="h-5 w-5" />
        ) : (
          <DefaultMark className="h-6 w-6 text-(--color-accent)" />
        )}
      </span>
      <div className="max-w-sm space-y-1.5">
        <p className="font-medium">{title}</p>
        {body ? <p className="text-sm leading-relaxed text-(--color-muted)">{body}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

function DefaultMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
