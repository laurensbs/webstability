"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Marketing nav-link, donkere header-variant. Active link is cream
 * vol, inactive is cream/65 met hover naar vol cream. Geen accent-
 * onderlijn — past bij Stripe-stijl rust.
 */
export function NavLink({ href, children }: { href: Href; children: React.ReactNode }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : ((href as { pathname?: string }).pathname ?? "");
  const active = target === "/" ? pathname === "/" : pathname.startsWith(target);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) ${
        active ? "text-(--color-bg)" : "text-(--color-bg)/65 hover:text-(--color-bg)"
      }`}
    >
      {children}
    </Link>
  );
}
