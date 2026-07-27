import { site } from '@/content/site'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const alt = `${site.name} — ${site.positioning.role}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgImage({
    kicker: site.positioning.role,
    title: site.name,
    subtitle: site.tagline[0],
  })
}
