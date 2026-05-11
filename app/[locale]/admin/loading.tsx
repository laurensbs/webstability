import { Spinner } from "@/components/animate/Spinner";

/**
 * Admin route-loader. Bewust minimaal — staff verwacht snelle loads;
 * dit voorkomt alleen een lege flash bij een trage query. Mono-eyebrow
 * + premium Spinner, in de admin-stijl.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <Spinner size={20} variant="accent" />
      <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-muted) uppercase">
        {"// laden"}
      </p>
    </div>
  );
}
