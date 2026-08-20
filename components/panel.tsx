import type { ReactNode } from 'react'

/**
 * The static panel: hairline frame, title bar, content well.
 *
 * Kept alongside `CollapsibleSection` for the two places that must *not*
 * collapse — the metrics strip, which is the page's credibility proof, and the
 * project deep-dive pages, where a collapsed body would hide the whole reason
 * the route exists. Everything else on the homepage is collapsible.
 */
export function Panel({
  title,
  meta,
  headingId,
  children,
}: {
  title: string
  meta?: string
  headingId?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-elevated/60">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline px-4 py-3.5">
        <h2
          id={headingId}
          className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.07em] text-fg uppercase"
        >
          {/* Amber's one job: a marker, never a word. */}
          <span className="size-1.5 shrink-0 rotate-45 bg-amber" aria-hidden="true" />
          {title}
        </h2>
        {meta ? <p className="text-[11px] text-muted">{meta}</p> : null}
      </div>
      {children}
    </div>
  )
}
