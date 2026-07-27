import { CELLS, PEERS, UNITS, isValidPlacement } from './grid'
import type { Rng } from './rng'
import type { Grid } from './types'

/**
 * Backtracking with most-constrained-cell ordering.
 *
 * The ordering is what keeps this fast enough to run in the browser: the
 * generator calls `countSolutions` once per candidate clue removal, so it runs
 * ~50 times per puzzle.
 */
function search(grid: Grid, limit: number, rng?: Rng, found: Grid[] = []): Grid[] {
  let bestIndex = -1
  let bestCandidates: number[] | null = null

  for (let index = 0; index < CELLS; index += 1) {
    if (grid[index] !== 0) continue

    const candidates: number[] = []
    for (let value = 1; value <= 9; value += 1) {
      if (isValidPlacement(grid, index, value)) candidates.push(value)
    }

    // A cell with no options means this branch is dead.
    if (candidates.length === 0) return found
    if (candidates.length === 1) {
      bestIndex = index
      bestCandidates = candidates
      break
    }
    if (!bestCandidates || candidates.length < bestCandidates.length) {
      bestIndex = index
      bestCandidates = candidates
    }
  }

  // No empty cell left: the grid is complete.
  if (bestIndex === -1 || !bestCandidates) {
    found.push([...grid])
    return found
  }

  if (rng) {
    for (let i = bestCandidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      const a = bestCandidates[i]!
      const b = bestCandidates[j]!
      bestCandidates[i] = b
      bestCandidates[j] = a
    }
  }

  for (const value of bestCandidates) {
    grid[bestIndex] = value
    search(grid, limit, rng, found)
    grid[bestIndex] = 0
    if (found.length >= limit) return found
  }

  return found
}

/** First solution, or null. Does not mutate the input. */
export function solve(grid: Grid, rng?: Rng): Grid | null {
  const working = [...grid]
  if (!isConsistent(working)) return null
  const found = search(working, 1, rng)
  return found[0] ?? null
}

/**
 * How many solutions exist, counted up to `limit`.
 *
 * Capped on purpose: proving "more than one" is all the generator needs, and
 * enumerating every solution of a sparse grid is exponential.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  const working = [...grid]
  if (!isConsistent(working)) return 0
  return search(working, limit).length
}

/** Are the filled cells free of duplicates? Cheap pre-check before searching. */
export function isConsistent(grid: Grid): boolean {
  for (let index = 0; index < CELLS; index += 1) {
    const value = grid[index]
    if (!value) continue
    for (const peer of PEERS[index]!) {
      if (grid[peer] === value) return false
    }
  }
  return true
}

/** Complete and legal: every cell filled, every unit a permutation of 1-9. */
export function isSolved(grid: Grid): boolean {
  if (grid.length !== CELLS) return false
  for (const value of grid) {
    if (!Number.isInteger(value) || value < 1 || value > 9) return false
  }
  for (const unit of UNITS) {
    const seen = new Set<number>()
    for (const index of unit) seen.add(grid[index]!)
    if (seen.size !== 9) return false
  }
  return true
}
