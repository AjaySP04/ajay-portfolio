import { CELLS } from './grid'
import { createGame, type GameState } from './game'
import { DIFFICULTIES, TECHNIQUES, type Difficulty, type Technique } from './types'

const GAME_KEY = 'sudoku:game:v1'
const BEST_KEY = 'sudoku:best:v1'

export type SavedGame = { state: GameState; elapsedMs: number }

type Serialized = {
  puzzle: number[]
  solution: number[]
  values: number[]
  notes: number[]
  cursor: number
  notesMode: boolean
  showMistakes: boolean
  difficulty: string
  hardestTechnique: string
  clues: number
  hintsUsed: number
  elapsedMs: number
}

/**
 * History is deliberately not persisted. Undo across a reload is not a promise
 * worth the storage, and restoring a 200-deep stack of 81-cell snapshots would
 * dwarf everything else in localStorage.
 */
export function saveGame(state: GameState, elapsedMs: number) {
  if (typeof window === 'undefined') return
  const payload: Serialized = {
    puzzle: state.puzzle,
    solution: state.solution,
    values: state.values,
    notes: state.notes,
    cursor: state.cursor,
    notesMode: state.notesMode,
    showMistakes: state.showMistakes,
    difficulty: state.difficulty,
    hardestTechnique: state.hardestTechnique,
    clues: state.clues,
    hintsUsed: state.hintsUsed,
    elapsedMs,
  }
  try {
    window.localStorage.setItem(GAME_KEY, JSON.stringify(payload))
  } catch {
    // Private browsing and full quotas both throw. Losing autosave is not worth
    // breaking the game over.
  }
}

const isGrid = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length === CELLS &&
  value.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= 9)

/** Anything malformed returns null and the caller generates a fresh puzzle. */
export function loadGame(): SavedGame | null {
  if (typeof window === 'undefined') return null

  let raw: string | null
  try {
    raw = window.localStorage.getItem(GAME_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<Serialized>
    if (!isGrid(parsed.puzzle) || !isGrid(parsed.solution) || !isGrid(parsed.values)) return null
    if (!DIFFICULTIES.includes(parsed.difficulty as Difficulty)) return null
    if (!TECHNIQUES.includes(parsed.hardestTechnique as Technique)) return null

    const notes =
      Array.isArray(parsed.notes) && parsed.notes.length === CELLS
        ? parsed.notes.map((mask) => (Number.isInteger(mask) ? mask : 0))
        : new Array(CELLS).fill(0)

    const base = createGame({
      puzzle: parsed.puzzle,
      solution: parsed.solution,
      difficulty: parsed.difficulty as Difficulty,
      hardestTechnique: parsed.hardestTechnique as Technique,
      techniquesUsed: [parsed.hardestTechnique as Technique],
      clues: typeof parsed.clues === 'number' ? parsed.clues : 0,
    })

    const solved = parsed.values.every((value, index) => value === parsed.solution![index])

    return {
      state: {
        ...base,
        values: parsed.values,
        notes,
        cursor: typeof parsed.cursor === 'number' ? parsed.cursor : base.cursor,
        notesMode: Boolean(parsed.notesMode),
        showMistakes: parsed.showMistakes !== false,
        hintsUsed: typeof parsed.hintsUsed === 'number' ? parsed.hintsUsed : 0,
        status: solved ? 'solved' : 'playing',
      },
      elapsedMs: typeof parsed.elapsedMs === 'number' ? parsed.elapsedMs : 0,
    }
  } catch {
    return null
  }
}

export function clearGame() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(GAME_KEY)
  } catch {
    /* nothing to do */
  }
}

export type BestTimes = Partial<Record<Difficulty, number>>

export function loadBestTimes(): BestTimes {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const best: BestTimes = {}
    for (const difficulty of DIFFICULTIES) {
      const value = parsed[difficulty]
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        best[difficulty] = value
      }
    }
    return best
  } catch {
    return {}
  }
}

/** Records the time only if it beats the stored one. Returns the new table. */
export function recordBestTime(difficulty: Difficulty, elapsedMs: number): BestTimes {
  const best = loadBestTimes()
  const current = best[difficulty]
  if (current !== undefined && current <= elapsedMs) return best

  const updated = { ...best, [difficulty]: elapsedMs }
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify(updated))
  } catch {
    /* nothing to do */
  }
  return updated
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
