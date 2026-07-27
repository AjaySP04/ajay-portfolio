/**
 * mulberry32 — small, fast, seedable.
 *
 * Seedable matters: the generator tests assert the same seed yields the same
 * puzzle, which is what makes a uniqueness failure reproducible instead of a
 * ghost.
 */
export function createRng(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof createRng>

/** Fisher-Yates, in place. */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const a = items[i]!
    const b = items[j]!
    items[i] = b
    items[j] = a
  }
  return items
}
