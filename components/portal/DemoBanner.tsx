import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Strings = {
  label: string;
  cta: string;
};

/**
 * Persistent wijn-rode banner bovenaan portal- en admin-layout wanneer
 * de huidige user `isDemo=true`. Niet dismissable — moet zichtbaar
 * blijven zodat bezoekers nooit denken dat ze in een echte sessie zitten.
 *
 * Gemount als server-component zodat we 0 JS aan de pagina toevoegen.
 */
export function DemoBanner({ strings }: { strings: Strings }) {
  return (
    <div className="border-b border-(--color-wine)/30 bg-(--color-wine) text-(--color-bg)">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2">
        <p className="inline-flex items-center gap-2 text-[13px] font-medium">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          {strings.label}
        </p>
        <Link
          href="/contact"
          className="text-[13px] font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          {strings.cta} →
        </Link>
      </div>
    </div>
  );
}
