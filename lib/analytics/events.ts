/**
 * The full event vocabulary. Kept in one place so a typo in a `data-track`
 * attribute is a type error rather than a silently-dropped event.
 */
export type AnalyticsEvent =
  | 'resume_downloaded'
  | 'project_clicked'
  | 'post_clicked'
  | 'channel_clicked'
  | 'contact_submitted'
  | 'section_viewed'
  | 'sudoku_started'
  | 'sudoku_completed'
  | 'theme_toggled'

export const ANALYTICS_EVENTS: AnalyticsEvent[] = [
  'resume_downloaded',
  'project_clicked',
  'post_clicked',
  'channel_clicked',
  'contact_submitted',
  'section_viewed',
  'sudoku_started',
  'sudoku_completed',
  'theme_toggled',
]

export type AnalyticsProps = Record<string, string | number | boolean | undefined>

/**
 * Attributes a server component adds to make an element tracked.
 *
 * This is why almost nothing had to become a client component: the provider owns
 * a single delegated listener, and server-rendered markup only carries data.
 *   <a data-track="project_clicked" data-track-slug="tarjuman" data-track-target="repo">
 */
export function trackAttrs(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  const attrs: Record<string, string> = { 'data-track': event }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue
    attrs[`data-track-${key}`] = String(value)
  }
  return attrs
}
