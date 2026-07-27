import { site } from '@/content/site'

/**
 * A fused AP monogram: the A's right stroke *is* the P's stem.
 *
 * Chosen over a node-graph mark because "dots joined by lines" is the house
 * style of every AI company and stops reading as a letter the moment it shrinks.
 * A monogram is personal, ages well, and survives at 16px. Square joins and a
 * 3.2 stroke match the site's hairline geometry rather than fighting it; the
 * amber bowl gives one point of colour and separates the two letters without an
 * outline.
 *
 * `currentColor` for the A means it inherits text colour and needs no
 * theme-specific variant.
 */
function MonogramPaths({ stroke, bowl }: { stroke: number; bowl: string }) {
  return (
    <g fill="none" strokeLinecap="square" strokeLinejoin="miter">
      {/* The diagonal rises into the top of the stem, so one stroke serves both
          letters — without that join the mark looks unresolved. */}
      <path d="M3.5 28 L15.5 4.5" stroke="currentColor" strokeWidth={stroke} />
      <path d="M15.5 4.5 V28" stroke="currentColor" strokeWidth={stroke} />
      <path d="M8.6 21.5 H15.5" stroke="currentColor" strokeWidth={stroke} />
      <path
        d="M15.5 5.6 H20.6 a5.9 5.9 0 0 1 0 11.8 H15.5"
        stroke={bowl}
        strokeWidth={stroke}
      />
    </g>
  )
}

export function LogoMark({
  className,
  compact = false,
}: {
  className?: string
  /** Heavier stroke for rendering at or below ~20px. */
  compact?: boolean
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true" focusable="false">
      <MonogramPaths stroke={compact ? 3.8 : 3.2} bowl="var(--color-accent)" />
    </svg>
  )
}

/**
 * The monogram on a filled plate.
 *
 * For avatar contexts — GitHub, LinkedIn, a browser tab — where a stroke-only
 * mark has no presence against an arbitrary background. Radius 4 is the design
 * system's cap.
 */
export function LogoTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="4" fill="currentColor" />
      <g transform="translate(2.2 2.2) scale(0.86)" className="text-canvas">
        <MonogramPaths stroke={3.4} bowl="var(--color-accent)" />
      </g>
    </svg>
  )
}

/** Name only, set in the mono face that carries the site's identity. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-mono tracking-tight whitespace-nowrap ${className ?? ''}`}>
      {site.name.toLowerCase()}
    </span>
  )
}

/**
 * Mark + name. The default for the header.
 *
 * Swaps the full name for initials below `sm` rather than letting a
 * 17-character name fight the nav for width.
 */
export function LogoLockup({ className }: { className?: string }) {
  const initials = site.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toLowerCase()

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark className="size-5 shrink-0" />
      <LogoWordmark className="hidden text-[13px] sm:inline" />
      <span className="font-mono text-[13px] tracking-tight sm:hidden">{initials}</span>
    </span>
  )
}
