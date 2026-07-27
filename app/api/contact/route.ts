import { render } from '@react-email/render'
import { Resend } from 'resend'
import { z } from 'zod'
import { ContactMessageEmail } from '@/emails/contact-message'
import { contact } from '@/content/contact'
import { site } from '@/content/site'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

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

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const accept = request.headers.get('accept') ?? ''
  const mode: Mode = accept.includes('application/json') ? 'json' : 'form'

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
  const limit = rateLimit(`contact:${ip}`, MAX_PER_WINDOW, WINDOW_MS)
  if (!limit.ok) {
    return new Response(
      mode === 'json'
        ? JSON.stringify({ ok: false, error: 'rate_limited', message: 'Too many messages. Try again shortly.' })
        : 'Too many messages from this address. Try again shortly.',
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
          'Content-Type': mode === 'json' ? 'application/json' : 'text/plain; charset=utf-8',
        },
      },
    )
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
  const receivedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

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
        subject: `Portfolio message from ${name}`,
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
