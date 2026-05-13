// Hele simpele in-memory rate-limit. Bewust géén Upstash/KV (geen extra
// SaaS-afhankelijkheid voor een one-person studio); de trade-off is dat
// op Vercel met meerdere serverless-instances de teller niet wordt
// gedeeld — een vasthoudende bot kan dan meer komen dan het limiet aangeeft.
// Voor de use-case (configurator + auth-flow) is dat acceptabel: honeypot
// vangt scripted-bots, en deze counter vangt de eerlijke double-submit
// + amateur-bots. Wanneer we naar Upstash gaan, swap je alleen de body.
//
// Gebruik:
//   const r = rateLimit({ key: `cfg:email:${email}`, max: 1, windowMs: 60_000 });
//   if (!r.ok) return retryAfter(r.resetAt);

type Bucket = { count: number; resetAt: number };

// Map blijft per node-instance bestaan (zolang die warm is). Bij cold-
// start beginnen we weer met een lege Map — geen probleem voor onze
// limieten.
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number };

/**
 * Increment-and-check. `max` = aantal toegestaan binnen `windowMs`.
 * De `key` bepaalt het bucket — typisch een prefix + IP of email.
 */
export function rateLimit(input: { key: string; max: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(input.key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, { count: 1, resetAt });
    return { ok: true, remaining: input.max - 1, resetAt };
  }

  if (bucket.count >= input.max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: input.max - bucket.count, resetAt: bucket.resetAt };
}

/** Helper: lees de eerste plausibele client-IP uit een Headers-object. */
export function clientIpFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}
