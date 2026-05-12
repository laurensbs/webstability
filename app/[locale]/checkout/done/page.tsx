import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { provisionAccountForCheckout } from "@/app/actions/auth";
import { CheckoutWelcome } from "@/components/marketing/CheckoutWelcome";

/**
 * Landing-pagina na een Stripe Checkout success. Twee scenario's:
 *
 * 1. Bezoeker was al ingelogd → rechtstreeks doorsturen naar
 *    /portal/dashboard. De bestaande webhook koppelt de subscription
 *    aan de juiste org.
 *
 * 2. Bezoeker was anoniem → we hebben een session_id queryparam, halen
 *    daar email + naam uit, maken een nieuwe user + org aan en mailen
 *    een "stel je wachtwoord in"-link. Na het instellen logt de klant
 *    gewoon in met e-mail + wachtwoord — geen magic-link nodig.
 *
 * De Stripe webhook hangt al de subscription aan de org via
 * stripeCustomerId — wij hoeven hier alleen de user + org te zaaien.
 */
export default async function CheckoutDone({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { session_id } = await searchParams;
  const session = await auth();

  // Was al ingelogd? Direct door naar dashboard.
  if (session?.user?.id) {
    redirect("/portal/dashboard?checkout=success");
  }

  // Anoniem zonder session_id — onmogelijk hier te belanden, terug naar prijzen.
  if (!session_id) {
    redirect("/prijzen");
  }

  // Haal Stripe checkout session op. Hier zit email + naam + customer.
  const checkoutSession = await stripe().checkout.sessions.retrieve(session_id, {
    expand: ["customer"],
  });
  const customerObj =
    checkoutSession.customer && typeof checkoutSession.customer === "object"
      ? checkoutSession.customer
      : null;
  const customerNotDeleted =
    customerObj && !("deleted" in customerObj && customerObj.deleted) ? customerObj : null;
  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : (customerObj?.id ?? null);
  const email = checkoutSession.customer_details?.email ?? customerNotDeleted?.email ?? "";
  const name = checkoutSession.customer_details?.name ?? customerNotDeleted?.name ?? null;
  const plan = (checkoutSession.metadata?.plan ?? null) as "care" | "studio" | "atelier" | null;

  if (!email || !customerId) {
    // Iets onverwachts — Stripe zou altijd een email moeten teruggeven.
    redirect("/prijzen?checkout=missing_email");
  }

  // Bestaat de user al? (Bv. iemand die eerder al inlogde maar uitgelogd was.)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (existingUser?.organizationId) {
    // User + org bestaan al — de webhook koppelt de subscription. Stuur
    // 'm naar login zodat hij in z'n eigen portal land.
    redirect(`/login?email=${encodeURIComponent(email)}&from=checkout`);
  }

  // Anders: nieuwe org + user aanmaken. Slug afgeleid uit naam, dedupe
  // met numerieke suffix als die al bestaat.
  const baseSlug =
    (name ?? email.split("@")[0] ?? "klant")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "klant";
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const conflict = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      columns: { id: true },
    });
    if (!conflict) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const orgName = name ?? email.split("@")[0] ?? "Nieuwe klant";
  const country = locale === "es" ? "ES" : "NL";

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: orgName,
      slug,
      country,
      plan,
      planStartedAt: plan ? new Date() : null,
      stripeCustomerId: customerId,
    })
    .returning({ id: organizations.id });

  if (existingUser) {
    // Bestaande user die nog geen org had — koppel 'm als owner.
    await db
      .update(users)
      .set({ organizationId: newOrg.id, role: "owner" })
      .where(eq(users.id, existingUser.id));
  }
  // Maak (indien nodig) de user aan + mail een "stel je wachtwoord in"-link.
  // Werkt ook als de user al bestond (dan: alleen een nieuwe set-link).
  // Faalt graceful — mag de checkout-flow niet blokkeren.
  try {
    await provisionAccountForCheckout({
      email: email.toLowerCase(),
      name,
      organizationId: newOrg.id,
      locale: locale === "es" ? "es" : "nl",
    });
    if (existingUser) {
      // provisionAccountForCheckout zet role niet — zorg dat hij owner is.
      await db.update(users).set({ role: "owner" }).where(eq(users.id, existingUser.id));
    }
  } catch (err) {
    console.error("[checkout/done] account provisioning failed:", err);
  }

  // Klaar — toon een kort "je bent binnen"-moment, dan naar /login.
  const loginUrl = `/login?email=${encodeURIComponent(email)}&from=checkout`;
  const t = await getTranslations("checkout.welcome");
  return (
    <CheckoutWelcome
      email={email}
      redirectTo={loginUrl}
      strings={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        body: t("body"),
        cta: t("cta"),
        redirecting: t("redirecting"),
      }}
    />
  );
}
