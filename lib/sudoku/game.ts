import { CELLS, PEERS, colOf, rowOf } from './grid'
import { nextDeduction } from './techniques'
import type { Difficulty, Grid, Puzzle, Technique } from './types'

export type GameState = {
  puzzle: Grid
  solution: Grid
  /** Player's grid, givens included. */
  values: Grid
  /** Pencil marks, one 9-bit mask per cell. */
  notes: number[]
  cursor: number
  notesMode: boolean
  showMistakes: boolean
  difficulty: Difficulty
  hardestTechnique: Technique
  clues: number
  hintsUsed: number
  status: 'playing' | 'solved'
  /** Last technique a hint used, for the status line. */
  lastHint: Technique | null
  past: Snapshot[]
  future: Snapshot[]
}

type Snapshot = { values: Grid; notes: number[] }

export type GameAction =
  /** Swap in a whole game: a new puzzle, or one restored from storage. */
  | { type: 'restore'; state: GameState }
  | { type: 'setCursor'; index: number }
  | { type: 'moveCursor'; dRow: number; dCol: number }
  | { type: 'enter'; value: number }
  | { type: 'clear' }
  | { type: 'toggleNotesMode' }
  | { type: 'toggleMistakes' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'hint' }

export const noteBit = (value: number) => 1 << (value - 1)
export const hasNote = (mask: number, value: number) => (mask & noteBit(value)) !== 0

export function noteValues(mask: number): number[] {
  const values: number[] = []
  for (let value = 1; value <= 9; value += 1) if (hasNote(mask, value)) values.push(value)
  return values
}

export function isGiven(state: GameState, index: number): boolean {
  return state.puzzle[index] !== 0
}

/** Filled, and not what the solution says. */
export function isMistake(state: GameState, index: number): boolean {
  const value = state.values[index]!
  return value !== 0 && value !== state.solution[index]
}

export function remainingCount(state: GameState, value: number): number {
  let placed = 0
  for (let index = 0; index < CELLS; index += 1) {
    if (state.values[index] === value) placed += 1
  }
  return 9 - placed
}

export function createGame(puzzle: Puzzle): GameState {
  return {
    puzzle: [...puzzle.puzzle],
    solution: [...puzzle.solution],
    values: [...puzzle.puzzle],
    notes: new Array(CELLS).fill(0),
    // Start on the first cell the player can actually edit.
    cursor: puzzle.puzzle.findIndex((value) => value === 0),
    notesMode: false,
    showMistakes: true,
    difficulty: puzzle.difficulty,
    hardestTechnique: puzzle.hardestTechnique,
    clues: puzzle.clues,
    hintsUsed: 0,
    status: 'playing',
    lastHint: null,
    past: [],
    future: [],
  }
}

function snapshot(state: GameState): Snapshot {
  return { values: [...state.values], notes: [...state.notes] }
}

/** Cap history so a long session cannot grow memory without bound. */
const HISTORY_LIMIT = 200

function withHistory(state: GameState, next: Partial<GameState>): GameState {
  const past = [...state.past, snapshot(state)].slice(-HISTORY_LIMIT)
  return { ...state, ...next, past, future: [] }
}

function solvedAgainst(values: Grid, solution: Grid): boolean {
  for (let index = 0; index < CELLS; index += 1) {
    if (values[index] !== solution[index]) return false
  }
  return true
}

/**
 * Placing a digit clears that pencil mark from every peer — the bookkeeping a
 * player would otherwise do by hand, and the main reason notes are worth having.
 */
function clearPeerNotes(notes: number[], index: number, value: number): number[] {
  const next = [...notes]
  next[index] = 0
  for (const peer of PEERS[index]!) {
    next[peer] = (next[peer] ?? 0) & ~noteBit(value)
  }
  return next
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'restore':
      return action.state

    case 'setCursor':
      if (action.index < 0 || action.index >= CELLS) return state
      return { ...state, cursor: action.index }

    case 'moveCursor': {
      const row = rowOf(state.cursor)
      const col = colOf(state.cursor)
      // Clamp rather than wrap: wrapping makes arrow keys feel unpredictable.
      const nextRow = Math.min(8, Math.max(0, row + action.dRow))
      const nextCol = Math.min(8, Math.max(0, col + action.dCol))
      return { ...state, cursor: nextRow * 9 + nextCol }
    }

    case 'toggleNotesMode':
      return { ...state, notesMode: !state.notesMode }

    case 'toggleMistakes':
      return { ...state, showMistakes: !state.showMistakes }

    case 'enter': {
      const index = state.cursor
      if (state.status === 'solved' || isGiven(state, index)) return state
      if (action.value < 1 || action.value > 9) return state

      if (state.notesMode) {
        // Notes on a filled cell would be invisible, so ignore it.
        if (state.values[index] !== 0) return state
        const notes = [...state.notes]
        notes[index] = (notes[index] ?? 0) ^ noteBit(action.value)
        return withHistory(state, { notes })
      }

      const values = [...state.values]
      // Pressing the same digit again clears it — a toggle beats hunting for
      // a separate erase key.
      const nextValue = values[index] === action.value ? 0 : action.value
      values[index] = nextValue

      const notes =
        nextValue === 0
          ? [...state.notes]
          : clearPeerNotes(state.notes, index, nextValue)

      const solved = solvedAgainst(values, state.solution)
      return withHistory(state, {
        values,
        notes,
        status: solved ? 'solved' : 'playing',
      })
    }

    case 'clear': {
      const index = state.cursor
      if (state.status === 'solved' || isGiven(state, index)) return state
      if (state.values[index] === 0 && state.notes[index] === 0) return state
      const values = [...state.values]
      const notes = [...state.notes]
      values[index] = 0
      notes[index] = 0
      return withHistory(state, { values, notes })
    }

    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        ...state,
        values: previous.values,
        notes: previous.notes,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
        status: solvedAgainst(previous.values, state.solution) ? 'solved' : 'playing',
      }
    }

    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        values: next.values,
        notes: next.notes,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        status: solvedAgainst(next.values, state.solution) ? 'solved' : 'playing',
      }
    }

    case 'hint': {
      if (state.status === 'solved') return state

      // Wrong entries block every deduction, so clear one first and say so.
      for (let index = 0; index < CELLS; index += 1) {
        if (isMistake(state, index)) {
          const values = [...state.values]
          values[index] = 0
          return withHistory(state, {
            values,
            cursor: index,
            hintsUsed: state.hintsUsed + 1,
            lastHint: null,
          })
        }
      }

      const deduction = nextDeduction(state.values)
      if (!deduction) return state

      const values = [...state.values]
      values[deduction.index] = deduction.value
      const notes = clearPeerNotes(state.notes, deduction.index, deduction.value)

      return withHistory(state, {
        values,
        notes,
        cursor: deduction.index,
        hintsUsed: state.hintsUsed + 1,
        lastHint: deduction.technique,
        status: solvedAgainst(values, state.solution) ? 'solved' : 'playing',
      })
    }

    default:
      return state
  }
}
