import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { CheckoutWelcome } from "@/components/marketing/CheckoutWelcome";

/**
 * Landing-pagina na een Stripe Checkout success. Twee scenario's:
 *
 * 1. Bezoeker was al ingelogd → rechtstreeks doorsturen naar
 *    /portal/dashboard. De bestaande webhook koppelt de subscription
 *    aan de juiste org.
 *
 * 2. Bezoeker was anoniem → we hebben een session_id queryparam, halen
 *    daar email + naam uit, maken een nieuwe user + org aan en sturen
 *    de bezoeker naar /login zodat hij zijn magic-link ontvangt.
 *    Daarna zit hij in z'n eigen klant-portaal.
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

  const userIfExists = existingUser;
  if (userIfExists) {
    await db
      .update(users)
      .set({ organizationId: newOrg.id, role: "owner" })
      .where(eq(users.id, userIfExists.id));
  } else {
    await db.insert(users).values({
      email: email.toLowerCase(),
      name,
      emailVerified: new Date(),
      locale: locale === "es" ? "es" : "nl",
      role: "owner",
      isStaff: false,
      organizationId: newOrg.id,
    });
    // De Auth.js `createUser`-event fire't hier niet (we maken de user
    // direct via Drizzle aan), dus de welkom-mail expliciet sturen.
    // Faalt graceful — mag de checkout-flow niet blokkeren.
    try {
      const baseUrl = process.env.AUTH_URL ?? "https://webstability.eu";
      const portalUrl = `${baseUrl}/${locale === "es" ? "es/" : ""}portal/dashboard`;
      await sendWelcomeEmail({
        to: email.toLowerCase(),
        name,
        portalUrl,
        locale: locale === "es" ? "es" : "nl",
      });
    } catch (err) {
      console.error("[checkout/done] welcome email failed:", err);
    }
  }

  // Klaar — toon een kort "je bent binnen"-moment, dan naar /login waar de
  // magic-link begint. (De redirect kon ook hier server-side, maar dan mist
  // de klant de bevestiging.)
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
