"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { MarkupText } from "@/components/animate/MarkupText";

/**
 * Error-boundary binnen het portal — vangt fouten in een portal-pagina op
 * zonder de bezoeker naar de marketing-error te sturen (verkeerde context
 * voor een ingelogde klant). Blijft binnen de portal-layout (sidebar/topbar
 * staan er nog), biedt "opnieuw" + "terug naar dashboard".
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.portalBoundary");

  React.useEffect(() => {
    if (typeof console !== "undefined") console.error("[portal-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] max-w-2xl flex-col justify-center space-y-5">
      <p className="font-mono text-[11px] tracking-[0.18em] text-(--color-accent) uppercase">
        {"// "}
        {t("eyebrow")}
      </p>
      <h1 className="text-h2">
        <MarkupText>{t("title")}</MarkupText>
      </h1>
      <p className="text-(--color-muted)">{t("lede")}</p>
      {error.digest ? (
        <p className="font-mono text-[11px] tracking-wide text-(--color-muted)">
          {"// "}error: {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-1">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="outline">
          <Link href="/portal/dashboard">{t("homeCta")}</Link>
        </Button>
      </div>
    </div>
  );
}
