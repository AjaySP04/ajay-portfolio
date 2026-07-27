'use client'

import { useState } from 'react'
import Script from 'next/script'
import { CircleCheck, Send, TriangleAlert } from 'lucide-react'
import { track } from '@/lib/analytics/client'
import type { ContactField } from '@/content/contact'

type Copy = {
  fields: ContactField[]
  honeypotField: string
  submitLabel: string
  submittingLabel: string
  successMessage: string
  unconfiguredMessage: string
  genericErrorMessage: string
  noScriptMessage: string
}

/**
 * Turnstile's site key. Read from the environment at build time, so the widget
 * and its script simply do not exist until the key is set — no third-party
 * request, no bytes, no behaviour change for the current deployment.
 *
 * Inlined here rather than passed as a prop because it is public by definition
 * and NEXT_PUBLIC_ vars are substituted into the client bundle anyway.
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'failed'; message: string; fieldErrors: Record<string, string> }

const INPUT =
  'ease-console w-full rounded-sm border border-hairline bg-canvas px-3 py-2.5 font-sans text-[14px] text-fg transition-colors duration-200 outline-none placeholder:text-faint focus:border-accent'

/**
 * Copy arrives as props, never imported: content/contact.ts pulls in zod at
 * module scope, and importing it here would ship the validator to the browser.
 *
 * Validation is native HTML only for the same reason. The authoritative check is
 * the zod schema in the route handler.
 *
 * The form has a real `action` and `method`, so it still submits with JavaScript
 * disabled — the handler answers a native post with a 303 to /contact/sent.
 */
export function ContactForm({ copy }: { copy: Copy }) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const payload = Object.fromEntries(new FormData(form).entries())

    setState({ kind: 'sending' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
        fieldErrors?: Record<string, string>
      }

      if (response.ok && body.ok) {
        form.reset()
        setState({ kind: 'sent' })
        track('contact_submitted', { outcome: 'sent' })
        return
      }

      track('contact_submitted', { outcome: body.error ?? 'failed' })

      setState({
        kind: 'failed',
        message:
          body.message ??
          (body.error === 'unconfigured' ? copy.unconfiguredMessage : copy.genericErrorMessage),
        fieldErrors: body.fieldErrors ?? {},
      })
    } catch {
      setState({ kind: 'failed', message: copy.genericErrorMessage, fieldErrors: {} })
    }
  }

  if (state.kind === 'sent') {
    return (
      <p
        role="status"
        className="flex items-start gap-2.5 rounded-sm border border-live/40 bg-live/[0.07] px-4 py-4 text-[14px] leading-relaxed text-fg"
      >
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-live" strokeWidth={1.75} aria-hidden="true" />
        {copy.successMessage}
      </p>
    )
  }

  const sending = state.kind === 'sending'
  const fieldErrors = state.kind === 'failed' ? state.fieldErrors : {}

  return (
    <form action="/api/contact" method="post" onSubmit={onSubmit} className="space-y-4">
      {copy.fields.map((field) => {
        const error = fieldErrors[field.name]
        const isMessage = field.name === 'message'

        return (
          <div key={field.name}>
            <label
              htmlFor={`contact-${field.name}`}
              className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-faint uppercase"
            >
              {field.label}
            </label>
            {isMessage ? (
              <textarea
                id={`contact-${field.name}`}
                name={field.name}
                rows={5}
                required
                minLength={10}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `contact-${field.name}-error` : undefined}
                className={`${INPUT} resize-y`}
              />
            ) : (
              <input
                id={`contact-${field.name}`}
                name={field.name}
                type={field.name === 'email' ? 'email' : 'text'}
                autoComplete={field.name === 'email' ? 'email' : 'name'}
                required
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `contact-${field.name}-error` : undefined}
                className={INPUT}
              />
            )}
            {error ? (
              <p
                id={`contact-${field.name}-error`}
                className="mt-1.5 font-mono text-[11px] text-accent-text"
              >
                {error}
              </p>
            ) : null}
          </div>
        )
      })}

      {/* Honeypot. Hidden from sight and from assistive tech, but a naive bot
          fills every input it finds. Not `type="hidden"` — bots skip those. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`contact-${copy.honeypotField}`}>Company website</label>
        <input
          id={`contact-${copy.honeypotField}`}
          name={copy.honeypotField}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Implicit rendering: Turnstile finds this container by class name and
          injects a hidden `cf-turnstile-response` input into the surrounding
          form, which means both submission paths pick the token up for free —
          FormData sees it here, and a native no-JS post carries it too. */}
      {TURNSTILE_SITE_KEY ? (
        <>
          <div
            className="cf-turnstile"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-theme="auto"
            data-size="flexible"
          />
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="lazyOnload"
          />
          {/* <noscript> rather than a runtime check: the browser decides whether
              to show this, so it costs nothing, needs no state, and cannot be
              wrong. Rendered only alongside the widget — with no captcha
              configured the form still works without JavaScript, and warning
              about a check that is not running would be a lie. */}
          <noscript>
            <p className="flex items-start gap-2.5 rounded-sm border border-accent/40 bg-accent/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-fg">
              <TriangleAlert
                className="mt-0.5 size-3.5 shrink-0 text-accent-text"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {copy.noScriptMessage}
            </p>
          </noscript>
        </>
      ) : null}

      {state.kind === 'failed' ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-sm border border-accent/40 bg-accent/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-fg"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-accent-text" strokeWidth={1.75} aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="ease-console inline-flex h-10 items-center gap-2 rounded-sm border border-accent bg-accent px-4 font-mono text-[12px] tracking-[0.12em] text-on-accent uppercase transition-colors duration-200 hover:bg-accent/88 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? copy.submittingLabel : copy.submitLabel}
        <Send className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  )
}
