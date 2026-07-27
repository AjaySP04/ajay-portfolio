/** 81 cells, row-major. 0 means empty. */
export type Grid = number[]

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

/**
 * Human solving techniques, ordered by difficulty. A puzzle's rating is the
 * hardest technique needed to finish it — clue count is a poor proxy, since a
 * 26-clue puzzle can be trivial and a 30-clue one can need an X-Wing.
 */
export const TECHNIQUES = [
  'nakedSingle',
  'hiddenSingle',
  'nakedPair',
  'hiddenPair',
  'lockedCandidates',
  'nakedTriple',
  'xWing',
] as const
export type Technique = (typeof TECHNIQUES)[number]

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  nakedSingle: 'Naked single',
  hiddenSingle: 'Hidden single',
  nakedPair: 'Naked pair',
  hiddenPair: 'Hidden pair',
  lockedCandidates: 'Locked candidates',
  nakedTriple: 'Naked triple',
  xWing: 'X-Wing',
}

/**
 * A band is a floor AND a ceiling on the hardest technique required.
 *
 * The floor is the part that matters. With only a ceiling, every band permits
 * naked singles, so a trivial puzzle satisfies all four and the difficulty
 * selector becomes decoration — which is exactly what the first implementation
 * did before the probe caught it.
 */
export const DIFFICULTY_BANDS: Record<Difficulty, { min: Technique; max: Technique }> = {
  easy: { min: 'nakedSingle', max: 'hiddenSingle' },
  medium: { min: 'nakedPair', max: 'hiddenPair' },
  hard: { min: 'lockedCandidates', max: 'lockedCandidates' },
  // Widened from xWing-only: a puzzle whose hardest *required* step is exactly an
  // X-Wing is rare enough that hunting for one took seconds and sometimes failed
  // outright. Triple-or-X-Wing is still strictly harder than `hard` and is found
  // quickly.
  expert: { min: 'nakedTriple', max: 'xWing' },
}

export const techniqueRank = (technique: Technique) => TECHNIQUES.indexOf(technique)

export function isWithinBand(difficulty: Difficulty, technique: Technique): boolean {
  const band = DIFFICULTY_BANDS[difficulty]
  const rank = techniqueRank(technique)
  return rank >= techniqueRank(band.min) && rank <= techniqueRank(band.max)
}

/** Every technique a band may require, floor through ceiling. */
export const DIFFICULTY_TECHNIQUES: Record<Difficulty, Technique[]> = Object.fromEntries(
  DIFFICULTIES.map((difficulty) => [
    difficulty,
    TECHNIQUES.filter((technique) => isWithinBand(difficulty, technique)),
  ]),
) as Record<Difficulty, Technique[]>

export type Puzzle = {
  /** Givens. 0 for cells the player must fill. */
  puzzle: Grid
  solution: Grid
  difficulty: Difficulty
  /** The hardest technique required, and everything used along the way. */
  hardestTechnique: Technique
  techniquesUsed: Technique[]
  clues: number
}

/** A single deduction the hint system can explain. */
export type Deduction = {
  index: number
  value: number
  technique: Technique
}
