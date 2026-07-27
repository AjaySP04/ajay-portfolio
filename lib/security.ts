import { site } from '@/content/site'

/**
 * Request-level defences for the one endpoint that accepts input.
 *
 * The threat model is not a targeted attacker — there is nothing here worth
 * stealing, no accounts and no database. It is the two things that actually
 * happen to a public contact form: commodity spam bots that POST to anything
 * shaped like a form, and someone deciding to flood the inbox. Everything below
 * is aimed at those, and each layer is cheap enough to run on every request.
 */

/** Largest body worth reading. The three fields cap out near 4.3KB of content. */
export const MAX_BODY_BYTES = 24_000

/**
 * Is this POST coming from our own pages?
 *
 * Browsers attach `Origin` to every cross-site request and to same-origin POSTs,
 * including native form submissions, so a real visitor always has one. A script
 * hitting the endpoint directly usually sends neither Origin nor Referer, which
 * makes this the single highest-yield check here: it removes the entire class of
 * drive-by bots that never load the page. It is not a security boundary — a
 * determined caller can forge the header — but it is not pretending to be one.
 *
 * `Referer` is accepted as a fallback for the rare browser that omits Origin on
 * same-origin form posts, and both being absent is treated as untrusted.
 */
export function isSameOrigin(headers: Headers): boolean {
  const allowed = allowedHosts(headers)

  const origin = headers.get('origin')?.trim()
  if (origin) {
    // 'null' is what a sandboxed iframe or a privacy extension sends.
    if (origin === 'null') return false
    const host = hostOf(origin)
    return host !== null && allowed.has(host)
  }

  const referer = headers.get('referer')?.trim()
  if (referer) {
    const host = hostOf(referer)
    return host !== null && allowed.has(host)
  }

  return false
}

function hostOf(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Hosts a submission may legitimately come from.
 *
 * Primarily the request's OWN host, which is what makes this work identically on
 * the real domain, on a Vercel preview URL with its generated hostname, and in
 * the Docker image on localhost — with nothing environment-specific to keep in
 * sync. An earlier version allowlisted the canonical host plus localhost gated on
 * NODE_ENV, which silently broke the form in any production build served from
 * anywhere else, the local preview included.
 *
 * The canonical host is added as well because the apex 308-redirects to www, and
 * a client that posts before following the redirect would otherwise be rejected.
 */
function allowedHosts(headers: Headers): Set<string> {
  const hosts = new Set<string>()

  // x-forwarded-host is what a proxy rewrites to; behind Vercel it is the one
  // that reflects the hostname the visitor actually typed.
  const requestHost = (headers.get('x-forwarded-host') ?? headers.get('host'))?.trim().toLowerCase()
  if (requestHost) hosts.add(requestHost)

  const canonical = new URL(site.url).host.toLowerCase()
  hosts.add(canonical)
  hosts.add(canonical.replace(/^www\./, ''))

  return hosts
}

/**
 * Cloudflare Turnstile, verified server-side.
 *
 * Inert until both keys are set, matching how PostHog is wired: the code ships
 * now and switches on with configuration rather than a deploy. Turnstile over
 * reCAPTCHA because it needs no cookies and shows no puzzle in the ordinary
 * case, which keeps the form usable and the site's cookieless stance intact.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY?.trim() || ''

/** Both halves must be present, or the check cannot be enforced honestly. */
export function turnstileEnabled(): boolean {
  return Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET)
}

export async function verifyTurnstile(
  token: unknown,
  ip: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!turnstileEnabled()) return { ok: true }
  if (typeof token !== 'string' || token === '') return { ok: false, reason: 'missing' }

  const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
  if (ip !== 'unknown') body.set('remoteip', ip)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      // A hung verifier must not hold the request open indefinitely.
      signal: AbortSignal.timeout(5_000),
    })
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (result.success) return { ok: true }
    return { ok: false, reason: result['error-codes']?.join(',') || 'rejected' }
  } catch (cause) {
    /**
     * Fail OPEN on a verifier outage.
     *
     * If Cloudflare is unreachable, rejecting would silently drop messages from
     * real people for as long as the outage lasts, and the other layers — same
     * origin, honeypot, four rate limits — are still in force. Losing a genuine
     * hiring enquiry is a worse outcome than admitting some spam.
     */
    console.warn('[contact] Turnstile verification unreachable — allowing through:', cause)
    return { ok: true }
  }
}

/**
 * Cheap spam signals.
 *
 * Returns a score, never a verdict, because the cost of a false positive here is
 * a lost job enquiry. A high score only tags the subject line so it can be
 * filtered in the inbox — the message is still delivered either way.
 */
export function spamScore({ name, message }: { name: string; message: string }): {
  score: number
  signals: string[]
} {
  const signals: string[] = []
  let score = 0

  const links = message.match(/https?:\/\//gi)?.length ?? 0
  if (links >= 4) {
    score += links >= 8 ? 2 : 1
    signals.push(`${links} links`)
  }

  if (/\b(bitcoin|crypto|casino|viagra|seo services|guest post|backlink)\b/i.test(message)) {
    score += 2
    signals.push('spam keyword')
  }

  // BBCode and raw anchor tags never appear in a message a person typed here.
  if (/\[url=|<a\s+href=/i.test(message)) {
    score += 2
    signals.push('markup')
  }

  if (name.length > 0 && name === name.toUpperCase() && name.length > 12) {
    score += 1
    signals.push('shouting name')
  }

  return { score, signals }
}
