import type { PostHog } from 'posthog-js'
import type { AnalyticsEvent, AnalyticsProps } from './events'

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || ''
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
/** Logs events instead of needing a real project. Used to verify wiring. */
export const ANALYTICS_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1'

export const CONSENT_KEY = 'analytics:consent:v1'
export type Consent = 'anonymous' | 'granted'

let client: PostHog | null = null
/** Events fired before the lazy PostHog chunk finishes loading. */
const pending: { event: AnalyticsEvent; props: AnalyticsProps }[] = []

export function setClient(instance: PostHog | null) {
  client = instance
  if (!client) return
  for (const item of pending.splice(0)) {
    client.capture(item.event, item.props)
  }
}

export function hasClient() {
  return client !== null
}

/**
 * Fire an event.
 *
 * Safe to call from anywhere, at any time: with no key configured it is a no-op
 * that makes no network request, and before PostHog has loaded it queues.
 */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  const clean: AnalyticsProps = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) clean[key] = value
  }

  if (ANALYTICS_DEBUG && typeof window !== 'undefined') {
    const log = ((window as unknown as { __analyticsLog?: unknown[] }).__analyticsLog ??= [])
    log.push({ event, props: clean })
    console.info('[analytics]', event, clean)
  }

  if (!POSTHOG_KEY) return
  if (client) client.capture(event, clean)
  else pending.push({ event, props: clean })
}

export function readConsent(): Consent {
  if (typeof window === 'undefined') return 'anonymous'
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'granted' ? 'granted' : 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function writeConsent(consent: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent)
  } catch {
    // Private browsing throws. The visitor simply gets asked again next time,
    // which is the correct failure direction.
  }
}

/** Has the visitor answered the bar yet? */
export function consentAnswered(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(CONSENT_KEY) !== null
  } catch {
    return true
  }
}

/**
 * Cookieless by default.
 *
 * `persistence: 'memory'` writes no cookie and no localStorage, so there is
 * nothing to ask permission for and the bar never blocks the first impression.
 * The trade-off is honest and worth stating: a returning visitor counts as new,
 * so unique-visitor numbers run high and retention is not measurable until
 * someone opts in.
 */
export function anonymousConfig() {
  return {
    api_host: POSTHOG_HOST,
    persistence: 'memory' as const,
    person_profiles: 'identified_only' as const,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
  }
}

/** Full tracking, once the visitor has opted in. */
export function grantedConfig() {
  return {
    api_host: POSTHOG_HOST,
    persistence: 'localStorage+cookie' as const,
    person_profiles: 'always' as const,
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: false,
  }
}
