import type { CSSProperties } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Panel } from '@/components/panel'
import { Section } from '@/components/section'
import { site } from '@/content/site'

/**
 * These are Audiomob-era numbers, not KPTAC numbers. The framing carries that
 * in three places — the panel title, a disclaimer band that cannot be scrolled
 * past, and a per-metric source line — because overstating them is the one
 * mistake on this page that would cost credibility in an interview.
 *
 * Fully server-rendered. The reveal is the `.reveal` CSS scroll-driven
 * animation, so the numbers are in the HTML and visible without any JS.
 */
export function MetricsStrip() {
  const { heading, disclaimer, footnote, items } = site.metrics

  return (
    <Section id="metrics">
      <Panel
        title={heading}
        headingId="metrics-heading"
        meta={`${items.length} metrics · career to date`}
      >
        <p className="flex items-start gap-2 border-b border-hairline bg-accent/[0.06] px-4 py-2.5 text-[11px] leading-relaxed text-accent-text">
          <TriangleAlert
            className="mt-px size-3.5 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          {disclaimer}
        </p>

        <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-5">
          {items.map((metric, index) => (
            <div
              key={metric.label}
              className={`bg-canvas px-4 py-5 ${
                index === items.length - 1 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="reveal" style={{ '--reveal-index': index } as CSSProperties}>
                <p className="flex items-baseline gap-1.5">
                  <span className="tnum text-[26px] leading-none font-medium tracking-[-0.02em] text-accent-text md:text-[30px]">
                    {metric.value}
                  </span>
                  {metric.unit ? (
                    <span className="text-xs text-muted">{metric.unit}</span>
                  ) : null}
                </p>
                <p className="mt-3 text-[11px] tracking-[0.06em] text-fg uppercase">
                  {metric.label}
                </p>
                <p className="mt-1 text-[11px] text-faint">{metric.source}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="border-t border-hairline px-4 py-3 text-[12px] leading-relaxed text-muted">
          {footnote}
        </p>
      </Panel>
    </Section>
  )
}
