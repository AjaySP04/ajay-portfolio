'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  POSTHOG_KEY,
  consentAnswered,
  grantedConfig,
  writeConsent,
} from '@/lib/analytics/client'

/**
 * An offer, not a gate.
 *
 * The site already measures everything it needs cookielessly, so this bar asks
 * for nothing it requires — it offers the extra (session replay, returning-
 * visitor identity) and takes "no" as a complete answer. That is why it is a
 * slim strip rather than a modal: nothing is blocked while it is open, and
 * declining costs the visitor nothing.
 *
 * It mounts only after a delay and is `fixed`, so it cannot contribute layout
 * shift to the initial paint.
 */
export function ConsentBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Nothing to consent to if telemetry is not configured at all.
    if (!POSTHOG_KEY) return
    if (consentAnswered()) return

    // Let the page settle before asking.
    const id = window.setTimeout(() => setVisible(true), 1500)
    return () => window.clearTimeout(id)
  }, [])

  if (!visible) return null

  const decide = async (consent: 'granted' | 'anonymous') => {
    writeConsent(consent)
    setVisible(false)

    if (consent !== 'granted') return
    const { default: posthog } = await import('posthog-js')
    // Upgrade in place rather than reloading: swap persistence, then start a
    // profile and a recording for the rest of the visit.
    posthog.set_config(grantedConfig())
    posthog.opt_in_capturing()
    posthog.startSessionRecording?.()
  }

  return (
    <div
      role="region"
      aria-label="Analytics preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-canvas/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-muted">
          This site counts visits without cookies. Allow full analytics —
          including session replay — to help me see what is worth improving?
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void decide('granted')}
            className="ease-console inline-flex h-9 items-center rounded-sm border border-accent bg-accent px-3 text-[11px] tracking-[0.05em] text-on-accent uppercase transition-colors duration-200 hover:bg-accent/88"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => void decide('anonymous')}
            className="ease-console inline-flex h-9 items-center gap-1.5 rounded-sm border border-hairline px-3 text-[11px] tracking-[0.05em] text-muted uppercase transition-colors duration-200 hover:border-hairline-strong hover:text-fg"
          >
            <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Keep it anonymous
          </button>
        </div>
      </div>
    </div>
  )
}
