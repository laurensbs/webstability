import { getTranslations } from "next-intl/server";
import { HowItWorks } from "@/components/marketing/HowItWorks";

/**
 * Server-side wrapper that hydrates the HowItWorks client component
 * with all its translation strings up front. Keeps the toggle UX
 * client-only without making the parent page client-rendered.
 */
export async function HowItWorksWrapper() {
  const t = await getTranslations("home.howItWorks");
  const tRaw = await getTranslations();
  const client = tRaw.raw("home.howItWorks.client") as {
    badge: string;
    object: string;
    dates: string;
    total: string;
    deposit: string;
    cta: string;
  };
  const owner = tRaw.raw("home.howItWorks.owner") as {
    badge: string;
    bookingId: string;
    customer: string;
    customerEmail: string;
    object: string;
    nights: string;
    total: string;
    paid: string;
    contract: string;
    deposit: string;
    calendar: string;
    statusLabel: string;
    statusValue: string;
    actionLabel: string;
    actionValue: string;
  };
  const flowSteps = tRaw.raw("home.howItWorks.flow.steps") as string[];

  return (
    <HowItWorks
      strings={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        lede: t("lede"),
        toggleClient: t("toggleClient"),
        toggleOwner: t("toggleOwner"),
        client,
        owner,
        flowSteps,
      }}
    />
  );
}
