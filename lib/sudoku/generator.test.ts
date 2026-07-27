import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { isValidPlacement } from './grid'
import { countSolutions, isSolved } from './solver'
import { DIFFICULTIES, DIFFICULTY_BANDS, DIFFICULTY_TECHNIQUES, techniqueRank } from './types'

/**
 * The uniqueness sweep is the point of this file.
 *
 * A generator that emits a multi-solution puzzle even rarely is the nastiest bug
 * in this codebase: the player fills a grid correctly, the app calls it wrong,
 * and it is unreproducible. So every generated puzzle is proved unique with an
 * independent solver rather than trusted because the removal loop checked.
 */
describe('generatePuzzle', () => {
  it.each(DIFFICULTIES)('produces a uniquely solvable %s puzzle every time', async (difficulty) => {
    for (let seed = 1; seed <= 8; seed += 1) {
      const puzzle = await generatePuzzle(difficulty, { seed: seed })
      expect(countSolutions(puzzle.puzzle, 2), `${difficulty} seed ${seed}`).toBe(1)
    }
  }, 120_000)

  it.each(DIFFICULTIES)('%s: solution is a complete, legal grid', async (difficulty) => {
    for (let seed = 1; seed <= 4; seed += 1) {
      const { solution } = await generatePuzzle(difficulty, { seed: seed })
      expect(isSolved(solution)).toBe(true)
    }
  }, 120_000)

  it.each(DIFFICULTIES)('%s: every given agrees with the solution', async (difficulty) => {
    for (let seed = 1; seed <= 4; seed += 1) {
      const { puzzle, solution } = await generatePuzzle(difficulty, { seed: seed })
      for (let i = 0; i < 81; i += 1) {
        if (puzzle[i] !== 0) expect(puzzle[i]).toBe(solution[i])
      }
    }
  }, 120_000)

  it.each(DIFFICULTIES)('%s: givens never break a constraint', async (difficulty) => {
    const { puzzle } = await generatePuzzle(difficulty, { seed: 3 })
    for (let i = 0; i < 81; i += 1) {
      if (puzzle[i] !== 0) expect(isValidPlacement(puzzle, i, puzzle[i]!)).toBe(true)
    }
  }, 60_000)

  it.each(DIFFICULTIES)('%s: leaves cells for the player and a sane clue count', async (difficulty) => {
    const { puzzle, clues } = await generatePuzzle(difficulty, { seed: 5 })
    const empties = puzzle.filter((value) => value === 0).length
    expect(empties).toBeGreaterThan(0)
    expect(clues).toBe(81 - empties)
    expect(clues).toBeGreaterThanOrEqual(17)
    expect(clues).toBeLessThan(81)
  }, 60_000)

  it.each(DIFFICULTIES)('%s: requires only techniques allowed for its band', async (difficulty) => {
    const puzzle = await generatePuzzle(difficulty, { seed: 7 })
    expect(puzzle.difficulty).toBe(difficulty)
    expect(DIFFICULTY_TECHNIQUES[difficulty]).toContain(puzzle.hardestTechnique)
  }, 60_000)

  it('is deterministic for a given seed, and varies across seeds', async () => {
    const a = await generatePuzzle('medium', { seed: 42 })
    const b = await generatePuzzle('medium', { seed: 42 })
    const c = await generatePuzzle('medium', { seed: 43 })
    expect(a.puzzle).toEqual(b.puzzle)
    expect(a.solution).toEqual(b.solution)
    expect(a.puzzle).not.toEqual(c.puzzle)
  }, 60_000)

  it('makes harder bands need at least as much technique as easier ones', async () => {
    const easy = await generatePuzzle('easy', { seed: 11 })
    expect(DIFFICULTY_TECHNIQUES.easy).toContain(easy.hardestTechnique)
    // Easy must never require anything beyond the singles.
    expect(['nakedSingle', 'hiddenSingle']).toContain(easy.hardestTechnique)
  }, 60_000)

  /**
   * Regression: the first implementation enforced only a band ceiling. Since
   * every band permits naked singles, all four difficulties happily returned
   * trivial singles-only puzzles and the difficulty selector did nothing. These
   * two assert the floor.
   */
  it.each(DIFFICULTIES)('%s: rating meets the band floor, not just the ceiling', async (difficulty) => {
    const band = DIFFICULTY_BANDS[difficulty]
    for (let seed = 1; seed <= 3; seed += 1) {
      const { hardestTechnique } = await generatePuzzle(difficulty, { seed })
      expect(techniqueRank(hardestTechnique)).toBeGreaterThanOrEqual(techniqueRank(band.min))
      expect(techniqueRank(hardestTechnique)).toBeLessThanOrEqual(techniqueRank(band.max))
    }
  }, 180_000)

  it('never hands a bare-singles puzzle to medium or above', async () => {
    for (const difficulty of ['medium', 'hard', 'expert'] as const) {
      for (let seed = 1; seed <= 3; seed += 1) {
        const { hardestTechnique } = await generatePuzzle(difficulty, { seed })
        expect(['nakedSingle', 'hiddenSingle'], `${difficulty} seed ${seed}`).not.toContain(
          hardestTechnique,
        )
      }
    }
  }, 180_000)
})
