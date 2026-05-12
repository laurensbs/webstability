import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function StubPage({ titleKey }: { titleKey: string }) {
  const tNav = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tStub = await getTranslations("stub");

  // Map slugs to existing translation keys so we don't need a separate dict.
  const titles: Record<string, string> = {
    services: tNav("services"),
    pricing: tNav("pricing"),
    about: tNav("about"),
    blog: tNav("blog"),
    contact: tNav("contact"),
    status: tFooter("status"),
  };

  return (
    <main className="dotted-bg py-section flex flex-1 items-center justify-center px-6">
      <div className="max-w-xl space-y-6 text-center">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">fase 2</p>
        <h1 className="text-4xl md:text-6xl">{titles[titleKey] ?? titleKey}</h1>
        <p className="text-(--color-muted)">{tStub("soon")}</p>
        <div>
          <Link
            href="/"
            className="inline-block rounded-md border border-(--color-border) px-5 py-3 text-sm font-medium transition-colors hover:bg-(--color-bg-warm)"
          >
            {tStub("back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
