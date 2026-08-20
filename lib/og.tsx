import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { site } from '@/content/site'
import { palette } from '@/lib/palette'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * Arimo, read from the installed fontsource package.
 *
 * The site itself ships no webfont — it is set in the system Helvetica/Arial
 * stack. Satori cannot use a system font, though: it has no font book to look
 * in and needs an actual file. Arimo is metric-compatible with Arial, so a
 * social card matches the page it points at instead of drifting to a face the
 * site no longer uses.
 *
 * Satori accepts ttf/otf/woff but NOT woff2, and fontsource ships both — hence
 * the explicit .woff. Reading from node_modules keeps the binary out of the repo
 * and needs no network at build; next.config.ts traces these files so the route
 * also works if it ever renders at request time.
 */
const FONT_DIR = path.join(process.cwd(), 'node_modules', '@fontsource', 'arimo', 'files')

let cached: { regular: Buffer; bold: Buffer } | null = null

async function fonts() {
  if (!cached) {
    const [regular, bold] = await Promise.all([
      readFile(path.join(FONT_DIR, 'arimo-latin-400-normal.woff')),
      readFile(path.join(FONT_DIR, 'arimo-latin-700-normal.woff')),
    ])
    cached = { regular, bold }
  }
  return cached
}

// Imported, never redeclared: a card that hardcodes its own hexes silently
// opts out of every future theme change. See lib/palette.ts.
const { canvas: CANVAS, hairline: HAIRLINE, fg: FG, muted: MUTED } = palette
/** Decorative only — the marker block. 2.09:1, far too weak for text. */
const ACCENT = palette.amber
/** Cyan darkened enough to read as text: 5.33:1 at worst. */
const ACCENT_TEXT = palette.accentText

/**
 * The shared social card. Mirrors the site: cool near-white, hairline frame,
 * Arial-metric type, one amber marker — so a shared link looks like the page it
 * points at.
 */
export async function renderOgImage({
  kicker,
  title,
  subtitle,
  footer,
}: {
  kicker: string
  title: string
  subtitle?: string
  footer?: string
}) {
  const { regular, bold } = await fonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: CANVAS,
          padding: 64,
          fontFamily: 'Arimo',
          position: 'relative',
        }}
      >
        {/* Hairline frame, echoing the console panels. */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 32,
            right: 32,
            bottom: 32,
            border: `1px solid ${HAIRLINE}`,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', width: 12, height: 12, backgroundColor: ACCENT }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: ACCENT_TEXT,
              fontWeight: 400,
            }}
          >
            {kicker}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 28 ? 66 : 84,
              lineHeight: 1.04,
              letterSpacing: -3,
              color: FG,
              fontWeight: 700,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.45,
                color: MUTED,
                maxWidth: 940,
                display: 'flex',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            color: MUTED,
            letterSpacing: 2,
          }}
        >
          <div style={{ display: 'flex' }}>{footer ?? site.positioning.qualifier}</div>
          <div style={{ display: 'flex', color: FG }}>{new URL(site.url).host}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Arimo', data: regular, weight: 400, style: 'normal' },
        { name: 'Arimo', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
