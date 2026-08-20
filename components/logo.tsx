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
 * mark has no presence against an arbitrary background.
 *
 * Kept square-ish rather than switched to the disc the favicon uses: at avatar
 * sizes a plate reads as a badge, and `app/icon.svg` already covers the tiny
 * end. If this and the favicon ever need to match exactly, change both — the
 * SVG file cannot read these tokens.
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

/**
 * The monogram inside a ring — the mark as a wheel.
 *
 * Exists for the page-load intro, where the mark rolls across the screen. The
 * ring is what makes that legible: a bare monogram spinning reads as a glitch,
 * because nothing about its silhouette suggests a thing that *can* roll. A
 * circle does, and the rotating monogram inside it then reads as the spoke.
 *
 * The ring is drawn in `currentColor` at a lighter weight than the letterforms
 * so it frames rather than competes.
 */
export function LogoWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true" focusable="false">
      <circle
        cx="16"
        cy="16"
        r="14.4"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      {/* A single tick at the top: without it a symmetrical ring gives the eye
          nothing to track and the rotation is invisible. */}
      <path d="M16 1.6 V5.2" stroke="var(--color-amber)" strokeWidth="1.8" strokeLinecap="butt" />
      {/* Pivots on the monogram's own bounding-box centre (15, 16.25), not on
          the viewBox centre. The mark is not symmetrical — the P's bowl pushes
          it right and the A's foot pushes it down — so scaling about (16, 16)
          leaves it visibly off-axis inside the ring. Imperceptible at 92px,
          obvious once the intro blooms it to 2.8x. */}
      <g transform="translate(16 16) scale(0.6) translate(-15 -16.25)">
        <MonogramPaths stroke={4.2} bowl="var(--color-amber)" />
      </g>
    </svg>
  )
}

/**
 * Name only, rendered exactly as `site.name` spells it.
 *
 * This used to force lowercase, which was a deliberate affectation while the
 * wordmark was set in JetBrains Mono — lowercase mono reads as a considered
 * lockup. In the system Helvetica/Arial stack it just reads as a typo in
 * someone's own name, so it renders capitalised.
 */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight whitespace-nowrap ${className ?? ''}`}>
      {site.name}
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
    .toUpperCase()

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark className="size-5 shrink-0" />
      <LogoWordmark className="hidden text-[14px] sm:inline" />
      <span className="text-[14px] font-semibold tracking-tight sm:hidden">{initials}</span>
    </span>
  )
}
