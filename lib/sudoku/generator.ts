import { CELLS, emptyGrid } from './grid'
import { createRng, shuffle, type Rng } from './rng'
import { countSolutions, solve } from './solver'
import { rateGrid } from './techniques'
import type { Difficulty, Grid, Puzzle, Technique } from './types'
import { DIFFICULTY_BANDS, isWithinBand, techniqueRank } from './types'

/**
 * Hand the main thread back so generation never becomes a long task.
 *
 * Measured before this existed: an expert puzzle took a median of 2.5s and up to
 * 5.5s of uninterrupted work, which freezes the page. `scheduler.yield` is
 * preferred where available because it resumes ahead of other queued tasks
 * rather than going to the back of the line.
 *
 * `null` means "do not yield" — the synchronous path used by tests and by any
 * caller off the main thread.
 */
type Yielder = (() => Promise<void>) | null

function defaultYielder(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  if (scheduler && typeof scheduler.yield === 'function') return scheduler.yield()
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** A complete, legal, randomised grid. */
function completeGrid(rng: Rng): Grid {
  const solved = solve(emptyGrid(), rng)
  if (!solved) throw new Error('Failed to build a complete grid')
  return solved
}

/**
 * Strip as many clues as possible while keeping the solution unique.
 *
 * Uniqueness is guaranteed *by construction*: a clue is only removed if exactly
 * one solution survives, so no ambiguous puzzle can escape this loop. Carving
 * all the way down (rather than stopping at a clue count) maximises difficulty;
 * the requested band is then reached by adding clues back.
 */
async function carve(solution: Grid, rng: Rng, yielder: Yielder): Promise<Grid> {
  const puzzle = [...solution]
  const order = shuffle(
    Array.from({ length: CELLS }, (_, i) => i),
    rng,
  )

  let sinceYield = 0
  for (const index of order) {
    const removed = puzzle[index]!
    puzzle[index] = 0
    if (countSolutions(puzzle, 2) !== 1) puzzle[index] = removed

    if (yielder && (sinceYield += 1) >= 8) {
      sinceYield = 0
      await yielder()
    }
  }

  return puzzle
}

/**
 * Add clues back until the puzzle lands inside the band.
 *
 * A maximally carved grid is usually harder than any band allows, or outright
 * unsolvable by human technique. Restoring clues walks difficulty monotonically
 * downward until it fits — and if it drops straight past the floor, this carve
 * cannot produce this band and the caller retries with a fresh grid.
 */
async function relaxIntoBand(
  carved: Grid,
  solution: Grid,
  difficulty: Difficulty,
  rng: Rng,
  yielder: Yielder,
): Promise<{ puzzle: Grid; rating: Technique } | null> {
  const puzzle = [...carved]
  const floor = techniqueRank(DIFFICULTY_BANDS[difficulty].min)

  const blanks = shuffle(
    puzzle.map((value, index) => (value === 0 ? index : -1)).filter((index) => index >= 0),
    rng,
  )

  for (let step = 0; step <= blanks.length; step += 1) {
    const rating = rateGrid(puzzle)

    if (rating !== null) {
      if (isWithinBand(difficulty, rating)) return { puzzle, rating }
      // Already easier than this band's floor; adding clues only makes it
      // easier still, so this carve is spent.
      if (techniqueRank(rating) < floor) return null
    }

    const next = blanks[step]
    if (next === undefined) return null
    puzzle[next] = solution[next]!

    if (yielder && step % 4 === 3) await yielder()
  }

  return null
}

const MAX_ATTEMPTS = 400

async function generate(
  difficulty: Difficulty,
  seed: number | undefined,
  yielder: Yielder,
): Promise<Puzzle> {
  const rng = createRng(seed ?? Math.floor(Math.random() * 0xffffffff))

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const solution = completeGrid(rng)
    const carved = await carve(solution, rng, yielder)
    const found = await relaxIntoBand(carved, solution, difficulty, rng, yielder)

    if (found) {
      // Never trust the carve loop alone — re-prove uniqueness on the grid that
      // is actually about to be handed to the player.
      if (countSolutions(found.puzzle, 2) === 1) {
        return {
          puzzle: found.puzzle,
          solution,
          difficulty,
          hardestTechnique: found.rating,
          techniquesUsed: [found.rating],
          clues: found.puzzle.filter((value) => value !== 0).length,
        }
      }
    }

    if (yielder) await yielder()
  }

  throw new Error(`Could not generate a ${difficulty} puzzle`)
}

export type GenerateOptions = {
  /** Reproducible generation. Omit for random play. */
  seed?: number
  /**
   * Yield to the browser during generation. Required on the main thread; leave
   * off in tests and workers, where the only cost would be timer overhead.
   */
  cooperative?: boolean
}

/**
 * Always async, deliberately.
 *
 * There is no synchronous variant because there cannot honestly be one: the
 * cooperative path must await, and an `async` core defers at every await
 * regardless of whether it yields, so a "sync" wrapper could never observe the
 * result. Non-cooperative generation still resolves on microtasks only, so it is
 * fast in tests.
 */
export function generatePuzzle(
  difficulty: Difficulty,
  options: GenerateOptions = {},
): Promise<Puzzle> {
  return generate(difficulty, options.seed, options.cooperative ? defaultYielder : null)
}
