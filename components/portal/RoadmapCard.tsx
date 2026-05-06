import { Map, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Item = {
  id: string;
  label: string;
  status: "shipped" | "active" | "next";
};

/**
 * Mini-roadmap voor Atelier-klanten: laat zien wat we recent
 * geleverd hebben, waar we nu aan werken, en wat de volgende stap
 * is. Voorlopig leiden we de drie items af van de meest recente
 * projecten van de org; volledige roadmap-modellering komt later.
 */
export function RoadmapCard({
  items,
  strings,
}: {
  items: Item[];
  strings: {
    title: string;
    shipped: string;
    active: string;
    next: string;
    empty: string;
    viewAll: string;
  };
}) {
  const labelFor = (s: Item["status"]) =>
    s === "shipped" ? strings.shipped : s === "active" ? strings.active : strings.next;
  const dotFor = (s: Item["status"]) =>
    s === "shipped"
      ? "bg-(--color-success)"
      : s === "active"
        ? "bg-(--color-accent)"
        : "bg-(--color-muted)";

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
          <h2 className="text-base font-medium">{strings.title}</h2>
        </div>
        <Sparkles className="h-3.5 w-3.5 text-(--color-accent)" aria-hidden />
      </header>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{strings.empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border)">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${dotFor(item.status)}`}
                  aria-hidden
                />
                <p className="min-w-0 truncate text-[14px]">{item.label}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {labelFor(item.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/portal/projects"
        className="block border-t border-(--color-border) bg-(--color-bg-warm) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase"
      >
        {strings.viewAll} →
      </Link>
    </section>
  );
}
