import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { site } from '@/content/site'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * JetBrains Mono, read from the installed fontsource package.
 *
 * Satori (behind ImageResponse) accepts ttf/otf/woff but NOT woff2, and
 * fontsource ships both — so this deliberately picks the .woff. Reading from
 * node_modules keeps the binary out of the repo and needs no network at build;
 * next.config.ts traces these files so the route also works if it ever renders
 * at request time.
 */
const FONT_DIR = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource',
  'jetbrains-mono',
  'files',
)

let cached: { regular: Buffer; bold: Buffer } | null = null

async function fonts() {
  if (!cached) {
    const [regular, bold] = await Promise.all([
      readFile(path.join(FONT_DIR, 'jetbrains-mono-latin-400-normal.woff')),
      readFile(path.join(FONT_DIR, 'jetbrains-mono-latin-700-normal.woff')),
    ])
    cached = { regular, bold }
  }
  return cached
}

const CANVAS = '#08090B'
const HAIRLINE = '#1E2227'
const FG = '#E7E9EC'
const MUTED = '#8A9199'
const ACCENT = '#F0A44A'

/**
 * The shared social card. Mirrors the site: near-black, hairline frame, mono
 * type, one amber accent — so a shared link looks like the page it points at.
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
          fontFamily: 'JetBrains Mono',
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
              color: ACCENT,
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
        { name: 'JetBrains Mono', data: regular, weight: 400, style: 'normal' },
        { name: 'JetBrains Mono', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
