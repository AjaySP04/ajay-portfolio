import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The section panel: hairline frame, a summary row that doubles as the toggle,
 * and a content well. Every content section hangs off this, which is what keeps
 * the page reading as one system rather than a stack of unrelated blocks.
 *
 * Native <details> rather than a JS disclosure, and rather than Radix — which
 * CLAUDE.md names as the a11y primitive layer but which is not actually
 * installed. Given the requirement that every section renders open and no state
 * is persisted, native markup is strictly better than any of them: correct
 * semantics, full keyboard support, works with JavaScript disabled, survives a
 * failed chunk, and costs zero bytes and zero hydration risk.
 *
 * The <h2> lives inside <summary> so the parent section's `aria-labelledby`
 * still resolves, and screen readers announce the heading and its expanded
 * state together.
 */
export function CollapsibleSection({
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
    <details className="accordion rounded-2xl border border-hairline bg-elevated/60" open>
      <summary className="ease-console flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-t-2xl px-4 py-3.5 transition-colors duration-200 hover:bg-sunken/70">
        <h2
          id={headingId}
          className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.07em] text-fg uppercase"
        >
          {/* Amber's one job on the page. It cannot be a word — every warm tone
              fails contrast as text on this canvas — so it is a marker. */}
          <span className="size-1.5 shrink-0 rotate-45 bg-amber" aria-hidden="true" />
          {title}
        </h2>
        {meta ? <p className="text-[11px] text-muted">{meta}</p> : null}
        <ChevronDown
          className="ease-console ml-auto size-4 shrink-0 self-center text-faint transition-transform duration-200 [details[open]_&]:rotate-180"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-hairline">{children}</div>
    </details>
  )
}
