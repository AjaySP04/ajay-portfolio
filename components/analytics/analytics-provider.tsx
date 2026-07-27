'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  ANALYTICS_DEBUG,
  POSTHOG_KEY,
  anonymousConfig,
  grantedConfig,
  readConsent,
  setClient,
  track,
} from '@/lib/analytics/client'
import type { AnalyticsEvent, AnalyticsProps } from '@/lib/analytics/events'

/**
 * Owns all telemetry wiring, and deliberately owns it in one place.
 *
 * Two decisions worth knowing:
 *
 * 1. posthog-js is dynamically imported. It is ~60KB gzip — larger than this
 *    entire site's own JavaScript — so putting it in the initial bundle would
 *    roughly double the payload. Loading it after hydration keeps it out of the
 *    critical path entirely, and `track()` queues anything fired before it lands.
 *
 * 2. One delegated click listener reads `data-track` attributes. That is why the
 *    hero buttons, project cards and footer links are all still server
 *    components — they carry data, not handlers.
 */
export function AnalyticsProvider() {
  const pathname = usePathname()
  const started = useRef(false)
  const seenSections = useRef(new Set<string>())

  // Boot PostHog once, after hydration.
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!POSTHOG_KEY) return

    let cancelled = false

    const boot = async () => {
      const { default: posthog } = await import('posthog-js')
      if (cancelled) return

      const consent = readConsent()
      posthog.init(POSTHOG_KEY, consent === 'granted' ? grantedConfig() : anonymousConfig())
      setClient(posthog)
    }

    // Idle rather than immediate: telemetry must never compete with the first
    // interaction. `requestIdleCallback` is not in Safari until recently.
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => void boot(), { timeout: 4000 })
        : window.setTimeout(() => void boot(), 1200)

    return () => {
      cancelled = true
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [])

  // Pageviews, including client-side navigations, which PostHog's automatic
  // capture does not see in the App Router.
  useEffect(() => {
    if (!pathname) return
    if (ANALYTICS_DEBUG) {
      const log = ((window as unknown as { __analyticsLog?: unknown[] }).__analyticsLog ??= [])
      log.push({ event: '$pageview', props: { pathname } })
    }
    if (!POSTHOG_KEY) return
    void import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) posthog.capture('$pageview', { pathname })
    })
  }, [pathname])

  // Sections reset per navigation so a return visit to / re-reports.
  useEffect(() => {
    seenSections.current = new Set()
  }, [pathname])

  // Delegated clicks.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const el = target.closest<HTMLElement>('[data-track]')
      if (!el) return

      const name = el.dataset.track as AnalyticsEvent | undefined
      if (!name) return

      const props: AnalyticsProps = {}
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key === 'track' || value === undefined) continue
        if (!key.startsWith('track')) continue
        // dataset turns data-track-slug into trackSlug.
        const prop = key.slice(5)
        props[prop.charAt(0).toLowerCase() + prop.slice(1)] = value
      }

      track(name, props)
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  // section_viewed, once per section per navigation.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-track-section]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const section = (entry.target as HTMLElement).dataset.trackSection
          if (!section || seenSections.current.has(section)) continue
          seenSections.current.add(section)
          track('section_viewed', { section })
        }
      },
      // A third visible is a read, not a scroll-past.
      { threshold: 0.33 },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [pathname])

  return null
}
