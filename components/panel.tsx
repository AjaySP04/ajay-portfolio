import type { ReactNode } from 'react'

/**
 * The console panel: hairline frame, title bar, content well. Every section
 * from Phase 2 onward hangs off this, which is what keeps the site reading as
 * one instrument rather than a stack of unrelated blocks.
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
    <div className="rounded-sm border border-hairline bg-elevated/60">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline px-4 py-3">
        <h2
          id={headingId}
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-fg uppercase"
        >
          {/* A neutral marker, not the logo: repeating the monogram on every
              panel title would dilute it into a bullet point. */}
          <span className="size-1.5 shrink-0 rotate-45 bg-accent" aria-hidden="true" />
          {title}
        </h2>
        {meta ? <p className="font-mono text-[11px] text-muted">{meta}</p> : null}
      </div>
      {children}
    </div>
  )
}
