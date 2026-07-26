type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_TRACKED_KEYS = 5_000

/**
 * Fixed-window limiter held in process memory.
 *
 * HONEST LIMITATION: on Vercel each serverless instance has its own memory, so a
 * burst spread across cold starts can exceed the nominal limit. It reliably
 * stops the case that actually happens — one client hammering the form — and
 * costs nothing. Move to Upstash/Redis if the form ever gets real abuse; the
 * call signature here is deliberately shaped so that swap is local.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()

  // Sweep before growing: an unbounded Map keyed by client IP is a memory leak.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [existingKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(existingKey)
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { ok: true, retryAfterSeconds: 0 }
}

/** Best available client address behind Vercel's proxy. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
