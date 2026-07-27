export { generatePuzzle, type GenerateOptions } from './generator'
export { CELLS, PEERS, ROWS, COLS, BOXES, UNITS, boxOf, colOf, rowOf, isValidPlacement, parseGrid, serializeGrid } from './grid'
export { countSolutions, isSolved, solve } from './solver'
export { candidatesFor, nextDeduction, rateGrid, solveWithTechniques } from './techniques'
export {
  DIFFICULTIES,
  DIFFICULTY_BANDS,
  DIFFICULTY_TECHNIQUES,
  TECHNIQUES,
  TECHNIQUE_LABELS,
  isWithinBand,
  techniqueRank,
  type Deduction,
  type Difficulty,
  type Grid,
  type Puzzle,
  type Technique,
} from './types'
