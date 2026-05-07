"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type OrgRow = {
  id: string;
  name: string;
  country: "NL" | "ES";
  plan: "care" | "studio" | "atelier" | null;
  isVip: boolean;
  createdAt: Date;
  memberCount: number;
  projectCount: number;
  openTicketCount: number;
};

type Strings = {
  searchPlaceholder: string;
  empty: string;
  members: (n: number) => string;
  projects: (n: number) => string;
  openTickets: (n: number) => string;
  vip: string;
};

/**
 * Client-side filterable lijst van orgs. Filter is een simpele
 * `includes()` op naam, country en plan — past bij het type volume
 * (tientallen, niet duizenden klanten). Bij voorbij ~200 orgs zou
 * server-side search met index-hit beter zijn.
 */
export function OrgTable({
  orgs,
  strings,
  locale,
}: {
  orgs: OrgRow[];
  strings: Strings;
  locale: string;
}) {
  const [query, setQuery] = React.useState("");
  const dateFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => {
      const hay = [o.name, o.country, o.plan ?? "", o.isVip ? "vip" : ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [orgs, query]);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={strings.searchPlaceholder}
          className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) pr-3 pl-10 text-[15px] outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-(--color-muted)">{strings.empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={{ pathname: "/admin/orgs/[orgId]", params: { orgId: o.id } }}
                prefetch
                className="flex items-center justify-between gap-6 px-6 py-4 transition-colors hover:bg-(--color-bg-warm)"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {o.name}
                    {o.isVip ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-(--color-wine)/10 px-2 py-0.5 text-[10px] font-medium text-(--color-wine)">
                        <Star className="h-2.5 w-2.5" fill="currentColor" />
                        {strings.vip}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-(--color-muted)">
                    {o.country} · {o.plan ?? "no-plan"} · {dateFmt.format(o.createdAt)}
                  </p>
                </div>
                <div className="hidden shrink-0 gap-4 font-mono text-xs text-(--color-muted) md:flex">
                  <span>{strings.members(o.memberCount)}</span>
                  <span>{strings.projects(o.projectCount)}</span>
                  {o.openTicketCount > 0 ? (
                    <span className="text-(--color-accent)">
                      {strings.openTickets(o.openTicketCount)}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
