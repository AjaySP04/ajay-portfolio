import { render } from '@react-email/render'
import { Resend } from 'resend'
import { z } from 'zod'
import { ContactMessageEmail } from '@/emails/contact-message'
import { contact } from '@/content/contact'
import { site } from '@/content/site'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import {
  MAX_BODY_BYTES,
  isSameOrigin,
  spamScore,
  turnstileEnabled,
  verifyTurnstile,
} from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Four windows, cheapest first.
 *
 * One limit cannot cover both shapes of abuse. Per-IP stops the obvious case of
 * a single client hammering the form, but a botnet rotates addresses and slips
 * straight through it — so GLOBAL is the backstop that decides how much mail the
 * inbox can receive in an hour no matter how many hosts are asking. BURST exists
 * because a human cannot send two considered messages in twenty seconds, and
 * EMAIL stops the same address being used over and over from fresh IPs.
 *
 * The global cap is the one with a real trade-off: hitting it turns the form off
 * for everyone, including a genuine visitor. 40/hour is set far above any
 * plausible organic rate for a personal site, so reaching it is itself evidence
 * of abuse.
 */
const LIMITS = {
  BURST: { max: 2, windowMs: 20 * 1000 },
  IP: { max: 5, windowMs: 10 * 60 * 1000 },
  EMAIL: { max: 3, windowMs: 60 * 60 * 1000 },
  GLOBAL: { max: 40, windowMs: 60 * 60 * 1000 },
} as const

const messageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.email('That email does not look right').max(200),
  message: z.string().trim().min(10, 'A little more detail, please').max(4000),
})

type Mode = 'json' | 'form'

function respond(
  mode: Mode,
  status: number,
  body: { ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> },
) {
  if (mode === 'json') {
    return Response.json(body, { status })
  }

  // Native (no-JavaScript) submission. Success goes to a real static page;
  // failures render a minimal readable page rather than raw JSON.
  if (body.ok) {
    return new Response(null, { status: 303, headers: { Location: '/contact/sent' } })
  }

  const detail = body.message ?? 'Something went wrong.'
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Message not sent</title>` +
      `<body style="font-family:system-ui;max-width:34rem;margin:4rem auto;padding:0 1rem;line-height:1.6">` +
      `<h1 style="font-size:1.25rem">Message not sent</h1><p>${detail}</p>` +
      `<p><a href="/#contact">Back to the form</a></p></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

/**
 * Does this Resend error mean "you may not send as that address"?
 *
 * Matched on message text because Resend does not expose a stable machine code
 * for it. Deliberately narrow: a generic failure must NOT trigger the fallback,
 * or a real outage would look like a sender problem forever.
 */
function isSenderRejected(error: { name?: string; message?: string }): boolean {
  const text = `${error.name ?? ''} ${error.message ?? ''}`.toLowerCase()
  return (
    text.includes('domain is not verified') ||
    text.includes('not verified') ||
    text.includes('verify a domain') ||
    (text.includes('domain') && text.includes('found')) ||
    text.includes('testing emails to your own email')
  )
}

/** 429 with the right Retry-After, in whichever format the caller asked for. */
function tooMany(mode: Mode, retryAfterSeconds: number, message: string) {
  return new Response(
    mode === 'json' ? JSON.stringify({ ok: false, error: 'rate_limited', message }) : message,
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'Content-Type': mode === 'json' ? 'application/json' : 'text/plain; charset=utf-8',
      },
    },
  )
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const accept = request.headers.get('accept') ?? ''
  const mode: Mode = accept.includes('application/json') ? 'json' : 'form'

  // Before anything else, and before any parsing: a body this large is either a
  // mistake or an attempt to make the server do work. Rejecting on the declared
  // length costs nothing and never allocates.
  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return respond(mode, 413, { ok: false, error: 'too_large', message: 'That message is too long.' })
  }

  /**
   * Reject anything not posted from our own pages.
   *
   * Checked before the honeypot so a bot that never loaded the form gets nothing
   * back but a 403 — no hint about which field mattered, and no work done.
   */
  if (!isSameOrigin(request.headers)) {
    return respond(mode, 403, {
      ok: false,
      error: 'forbidden',
      message: 'Submit the form from the site.',
    })
  }

  let raw: Record<string, unknown>
  try {
    if (contentType.includes('application/json')) {
      raw = (await request.json()) as Record<string, unknown>
    } else {
      raw = Object.fromEntries((await request.formData()).entries())
    }
  } catch {
    return respond(mode, 400, { ok: false, error: 'malformed', message: 'Could not read the form.' })
  }

  // Honeypot: a real person never sees this field. Answer as though the message
  // was accepted so a bot gets no signal about why it failed, but send nothing.
  const honeypot = raw[contact.honeypotField]
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return respond(mode, 200, { ok: true })
  }

  const ip = clientIp(request.headers)

  const burst = rateLimit(`contact:burst:${ip}`, LIMITS.BURST.max, LIMITS.BURST.windowMs)
  if (!burst.ok) {
    return tooMany(mode, burst.retryAfterSeconds, 'Slow down a moment, then send it again.')
  }

  const perIp = rateLimit(`contact:ip:${ip}`, LIMITS.IP.max, LIMITS.IP.windowMs)
  if (!perIp.ok) {
    return tooMany(mode, perIp.retryAfterSeconds, 'Too many messages from this address. Try again shortly.')
  }

  const global = rateLimit('contact:global', LIMITS.GLOBAL.max, LIMITS.GLOBAL.windowMs)
  if (!global.ok) {
    console.warn('[contact] GLOBAL rate limit reached — the form is closed for now. Likely abuse.')
    return tooMany(mode, global.retryAfterSeconds, 'The form is busy right now. Try WhatsApp or LinkedIn.')
  }

  const parsed = messageSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return respond(mode, 400, {
      ok: false,
      error: 'invalid',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    })
  }

  // `.trim() ||` rather than `??`: an env var supplied but empty is common in
  // container and CI setups, and `??` would happily accept the empty string.
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    // Deliberately not a fake success: the message would be silently lost.
    console.warn('[contact] RESEND_API_KEY is not set — message accepted but not delivered:', {
      name: parsed.data.name,
      email: parsed.data.email,
    })
    return respond(mode, 503, {
      ok: false,
      error: 'unconfigured',
      message: contact.unconfiguredMessage,
    })
  }

  const { name, email, message } = parsed.data

  // After validation, so the key is a real normalised address rather than
  // whatever arbitrary string was posted.
  const perEmail = rateLimit(
    `contact:email:${email.toLowerCase()}`,
    LIMITS.EMAIL.max,
    LIMITS.EMAIL.windowMs,
  )
  if (!perEmail.ok) {
    return tooMany(mode, perEmail.retryAfterSeconds, 'That address has already sent a few messages. Try again later.')
  }

  // Last gate before doing real work, because it costs a network round trip.
  // No-op unless both Turnstile keys are configured.
  const captcha = await verifyTurnstile(raw['cf-turnstile-response'], ip)
  if (!captcha.ok) {
    console.warn(`[contact] Turnstile rejected a submission (${captcha.reason}) from ${ip}`)
    return respond(mode, 400, {
      ok: false,
      error: 'captcha',
      message: turnstileEnabled()
        ? 'The bot check did not pass. Reload the page and try again.'
        : contact.genericErrorMessage,
    })
  }

  const receivedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

  /**
   * Tag rather than block. A wrong guess here costs a hiring enquiry, so a high
   * score only makes the message filterable in the inbox — it still gets sent.
   */
  const spam = spamScore({ name, message })
  const subject =
    spam.score >= 3
      ? `[likely spam: ${spam.signals.join(', ')}] Portfolio message from ${name}`
      : `Portfolio message from ${name}`

  try {
    const element = ContactMessageEmail({
      name,
      email,
      message,
      receivedAt,
      clientIp: ip,
      domain: new URL(site.url).host,
    })
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ])

    const resend = new Resend(apiKey)
    const to = [process.env.CONTACT_TO?.trim() || site.email]

    // CONTACT_FROM overrides; otherwise the configured domain sender.
    const preferredFrom = process.env.CONTACT_FROM?.trim() || site.mail.from

    const deliver = (from: string) =>
      resend.emails.send({
        from,
        to,
        replyTo: email,
        subject,
        html,
        text,
      })

    let { error } = await deliver(preferredFrom)

    /**
     * Fall back to Resend's shared sender if the domain is not verified yet.
     *
     * DNS propagation plus Resend verification is not instant, and a message from
     * a real person must not be lost in that window just because the nicer From
     * address is not live yet. Retries exactly once and warns in the log, so a
     * permanently unverified domain stays visible rather than silently masked.
     */
    if (error && preferredFrom !== site.mail.fallbackFrom && isSenderRejected(error)) {
      console.warn(
        `[contact] Resend rejected sender "${preferredFrom}" — domain likely not verified yet. ` +
          `Retrying as ${site.mail.fallbackFrom}.`,
        error,
      )
      ;({ error } = await deliver(site.mail.fallbackFrom))
    }

    if (error) {
      console.error('[contact] Resend rejected the message:', error)
      return respond(mode, 502, {
        ok: false,
        error: 'provider',
        message: contact.genericErrorMessage,
      })
    }
  } catch (cause) {
    console.error('[contact] Unexpected failure sending message:', cause)
    return respond(mode, 500, { ok: false, error: 'unknown', message: contact.genericErrorMessage })
  }

  return respond(mode, 200, { ok: true })
}

/** Anything other than POST is a mistake worth answering clearly. */
export function GET() {
  return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}
