import { z } from 'zod'

/**
 * Games live at /play. Array order is display order.
 *
 * Adding one is a new entry here plus its route — no component changes. The
 * index page, the nav count and the footer all read from this list, so a second
 * game appears everywhere at once.
 */

const gameSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tagline: z.string().min(1),
  /** What makes it worth a look, in a few words each. */
  highlights: z.array(z.string().min(1)).min(1),
  href: z.string().startsWith('/play/'),
  status: z.enum(['live', 'building']),
})

export type Game = z.infer<typeof gameSchema>

export const games: Game[] = z.array(gameSchema).min(1).parse([
  {
    slug: 'sudoku',
    title: 'Sudoku',
    tagline:
      'Keyboard-first, generated in the browser, with every puzzle proved to have exactly one solution before you see it.',
    highlights: [
      'Unique solution guaranteed',
      'Difficulty by solving technique',
      'Pencil marks, undo, hints',
      'Autosaves and tracks best times',
    ],
    href: '/play/sudoku',
    status: 'live',
  },
])

export const liveGames = games.filter((game) => game.status === 'live')
