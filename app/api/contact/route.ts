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
    const { error } = await resend.emails.send({
      // Until the domain is verified in Resend, onboarding@resend.dev is
      // the only sender that works. Override with CONTACT_FROM once it is.
      from: process.env.CONTACT_FROM?.trim() || 'Portfolio <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO?.trim() || site.email],
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      html,
      text,
    })

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
