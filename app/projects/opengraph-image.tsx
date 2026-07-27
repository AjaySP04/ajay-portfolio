import { projects } from '@/content/projects'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const alt = 'Projects'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgImage({
    kicker: 'Projects',
    title: 'Things built outside the day job',
    subtitle: 'Offline speech AI in Rust, a production payment-commission engine replica, and LLM integration work.',
    footer: `${projects.length} projects`,
  })
}
