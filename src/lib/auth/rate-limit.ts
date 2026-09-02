import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter. Fine for a single dev/staging
 * instance; swap for a Redis-backed limiter (e.g. Upstash) before running
 * more than one server process — see the blueprint's Security Architecture.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false as const, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true as const, remaining: limit - bucket.count };
}
