import { ArrowRight, ArrowUpRight, BookOpenText, Download } from 'lucide-react'
import { trackAttrs } from '@/lib/analytics/events'
import type { HeroAction } from '@/content/site'

const ICONS = {
  download: Download,
  read: BookOpenText,
  external: ArrowUpRight,
  arrow: ArrowRight,
} as const

/**
 * `primary` carries dark ink on the cyan fill, not white. That is forced rather
 * than chosen: white on this cyan measures 2.19:1, a hard fail, while the ink
 * token is 8.20:1. Both come from the palette together, so the pair cannot drift
 * apart in a future re-theme.
 *
 * `secondary` sits on the hero wash, so it needs an opaque surface — a
 * translucent one let the gradient bleed through and the label lost contrast
 * against the lighter end of it.
 */
const VARIANTS = {
  primary: 'border-accent bg-accent text-on-accent hover:bg-accent/88',
  secondary:
    'border-hairline-strong bg-elevated text-fg hover:border-accent hover:bg-sunken',
  ghost: 'border-transparent text-muted hover:border-hairline-strong hover:text-fg',
} as const

/**
 * Plain anchors throughout. The resume targets are route handlers, not pages —
 * next/link would try to client-navigate them and fall back anyway.
 */
export function ActionLink({ action }: { action: HeroAction }) {
  const Icon = ICONS[action.icon]

  /**
   * Three kinds of hero CTA, three events.
   *
   * This used to send everything that was not the résumé to channel_clicked,
   * which was fine while the third button pointed at GitHub. Now that Projects
   * and Engineering Notes are internal routes, that would file them as outbound
   * profile clicks and quietly corrupt the channel numbers.
   */
  const tracking = action.href.startsWith('/resume')
    ? trackAttrs('resume_downloaded', { source: 'hero', variant: action.variant })
    : action.external
      ? trackAttrs('channel_clicked', { channel: action.id, source: 'hero' })
      : trackAttrs('cta_clicked', { cta: action.id, source: 'hero', href: action.href })

  return (
    <a
      href={action.href}
      {...(action.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...tracking}
      className={`ease-console inline-flex h-11 items-center gap-2 rounded-lg border px-5 text-[14px] font-semibold transition-colors duration-200 ${VARIANTS[action.variant]}`}
    >
      {action.label}
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
    </a>
  )
}
