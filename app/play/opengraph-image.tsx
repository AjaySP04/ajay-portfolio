import { games } from '@/content/games'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const alt = 'Games'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgImage({
    kicker: 'Games',
    title: 'Small things, built properly',
    subtitle: 'Lightweight browser games — no accounts, no loading screens, nothing phoning home.',
    footer: `${games.length} game${games.length === 1 ? '' : 's'}`,
  })
}
