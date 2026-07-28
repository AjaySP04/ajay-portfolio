import { ArrowRight, ArrowUpRight, BookOpenText, Download } from 'lucide-react'
import { trackAttrs } from '@/lib/analytics/events'
import type { HeroAction } from '@/content/site'

const ICONS = {
  download: Download,
  read: BookOpenText,
  external: ArrowUpRight,
  arrow: ArrowRight,
} as const

const VARIANTS = {
  primary: 'border-accent bg-accent text-on-accent hover:bg-accent/88',
  secondary:
    'border-hairline bg-elevated/70 text-fg hover:border-hairline-strong hover:bg-raised',
  ghost: 'border-transparent text-muted hover:border-hairline hover:text-fg',
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
      className={`ease-console inline-flex h-10 items-center gap-2 rounded-sm border px-4 font-mono text-[12px] tracking-[0.12em] uppercase transition-colors duration-200 ${VARIANTS[action.variant]}`}
    >
      {action.label}
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
    </a>
  )
}
