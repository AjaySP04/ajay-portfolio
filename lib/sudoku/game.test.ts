import { beforeAll, describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { createGame, gameReducer, hasNote, isGiven, isMistake, noteValues, remainingCount, type GameState } from './game'
import type { Puzzle } from './types'

let puzzle: Puzzle
let base: GameState

beforeAll(async () => {
  puzzle = await generatePuzzle('easy', { seed: 99 })
  base = createGame(puzzle)
}, 60_000)

const firstEmpty = (state: GameState) => state.values.findIndex((value, i) => value === 0 && !isGiven(state, i))
const at = (state: GameState, index: number) => gameReducer(state, { type: 'setCursor', index })

describe('createGame', () => {
  it('starts the cursor on an editable cell', () => {
    expect(isGiven(base, base.cursor)).toBe(false)
  })

  it('starts unsolved with clean history', () => {
    expect(base.status).toBe('playing')
    expect(base.past).toHaveLength(0)
    expect(base.future).toHaveLength(0)
  })
})

describe('entering values', () => {
  it('writes into an empty cell', () => {
    const index = firstEmpty(base)
    const next = gameReducer(at(base, index), { type: 'enter', value: 5 })
    expect(next.values[index]).toBe(5)
  })

  it('refuses to overwrite a given', () => {
    const givenIndex = base.puzzle.findIndex((value) => value !== 0)
    const next = gameReducer(at(base, givenIndex), { type: 'enter', value: 9 })
    expect(next.values[givenIndex]).toBe(base.puzzle[givenIndex])
    expect(next.past).toHaveLength(0)
  })

  it('toggles the same digit off', () => {
    const index = firstEmpty(base)
    let state = gameReducer(at(base, index), { type: 'enter', value: 4 })
    state = gameReducer(state, { type: 'enter', value: 4 })
    expect(state.values[index]).toBe(0)
  })

  it('clears that pencil mark from peers when a digit is placed', () => {
    const index = firstEmpty(base)
    let state = at(base, index)
    // Put a note of 7 on a peer, then place 7 in the cell.
    const peer = [...base.values.keys()].find((i) => i !== index && !isGiven(base, i) && base.values[i] === 0 && sharesUnit(index, i))
    expect(peer).toBeDefined()
    state = gameReducer(state, { type: 'toggleNotesMode' })
    state = gameReducer(at(state, peer!), { type: 'enter', value: 7 })
    expect(hasNote(state.notes[peer!]!, 7)).toBe(true)
    state = gameReducer(state, { type: 'toggleNotesMode' })
    state = gameReducer(at(state, index), { type: 'enter', value: 7 })
    expect(hasNote(state.notes[peer!]!, 7)).toBe(false)
  })
})

function sharesUnit(a: number, b: number) {
  const sameRow = Math.floor(a / 9) === Math.floor(b / 9)
  const sameCol = a % 9 === b % 9
  const box = (i: number) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3)
  return sameRow || sameCol || box(a) === box(b)
}

describe('notes mode', () => {
  it('toggles individual marks without filling the cell', () => {
    const index = firstEmpty(base)
    let state = gameReducer(at(base, index), { type: 'toggleNotesMode' })
    state = gameReducer(state, { type: 'enter', value: 3 })
    state = gameReducer(state, { type: 'enter', value: 8 })
    expect(noteValues(state.notes[index]!)).toEqual([3, 8])
    expect(state.values[index]).toBe(0)
    state = gameReducer(state, { type: 'enter', value: 3 })
    expect(noteValues(state.notes[index]!)).toEqual([8])
  })

  it('ignores notes on a cell that already has a value', () => {
    const index = firstEmpty(base)
    let state = gameReducer(at(base, index), { type: 'enter', value: 2 })
    state = gameReducer(state, { type: 'toggleNotesMode' })
    const before = state.notes[index]
    state = gameReducer(state, { type: 'enter', value: 5 })
    expect(state.notes[index]).toBe(before)
  })
})

describe('cursor', () => {
  it('clamps at the edges rather than wrapping', () => {
    let state = at(base, 0)
    state = gameReducer(state, { type: 'moveCursor', dRow: -1, dCol: -1 })
    expect(state.cursor).toBe(0)
    state = at(state, 80)
    state = gameReducer(state, { type: 'moveCursor', dRow: 1, dCol: 1 })
    expect(state.cursor).toBe(80)
  })

  it('moves by row and column', () => {
    let state = at(base, 40)
    state = gameReducer(state, { type: 'moveCursor', dRow: 1, dCol: 0 })
    expect(state.cursor).toBe(49)
    state = gameReducer(state, { type: 'moveCursor', dRow: 0, dCol: -1 })
    expect(state.cursor).toBe(48)
  })
})

describe('undo and redo', () => {
  it('restores the previous grid, then reapplies it', () => {
    const index = firstEmpty(base)
    const entered = gameReducer(at(base, index), { type: 'enter', value: 6 })
    const undone = gameReducer(entered, { type: 'undo' })
    expect(undone.values[index]).toBe(0)
    const redone = gameReducer(undone, { type: 'redo' })
    expect(redone.values[index]).toBe(6)
  })

  it('is a no-op with nothing to undo or redo', () => {
    expect(gameReducer(base, { type: 'undo' })).toBe(base)
    expect(gameReducer(base, { type: 'redo' })).toBe(base)
  })

  it('drops the redo stack once a new move is made', () => {
    const index = firstEmpty(base)
    let state = gameReducer(at(base, index), { type: 'enter', value: 6 })
    state = gameReducer(state, { type: 'undo' })
    expect(state.future).toHaveLength(1)
    state = gameReducer(state, { type: 'enter', value: 2 })
    expect(state.future).toHaveLength(0)
  })

  it('undoes notes as well as values', () => {
    const index = firstEmpty(base)
    let state = gameReducer(at(base, index), { type: 'toggleNotesMode' })
    state = gameReducer(state, { type: 'enter', value: 4 })
    expect(hasNote(state.notes[index]!, 4)).toBe(true)
    state = gameReducer(state, { type: 'undo' })
    expect(hasNote(state.notes[index]!, 4)).toBe(false)
  })
})

describe('hints', () => {
  it('fills a cell with the correct value and names the technique', () => {
    const next = gameReducer(base, { type: 'hint' })
    expect(next.hintsUsed).toBe(1)
    expect(next.values[next.cursor]).toBe(base.solution[next.cursor])
    expect(next.lastHint).not.toBeNull()
  })

  it('removes a wrong entry first rather than deducing around it', () => {
    const index = firstEmpty(base)
    const wrong = base.solution[index] === 9 ? 8 : 9
    let state = gameReducer(at(base, index), { type: 'enter', value: wrong })
    expect(isMistake(state, index)).toBe(true)
    state = gameReducer(state, { type: 'hint' })
    expect(state.values[index]).toBe(0)
    expect(state.lastHint).toBeNull()
  })

  it('never introduces a mistake', () => {
    let state = base
    for (let i = 0; i < 15; i += 1) state = gameReducer(state, { type: 'hint' })
    for (let index = 0; index < 81; index += 1) expect(isMistake(state, index)).toBe(false)
  })
})

describe('solving', () => {
  it('reports solved once the grid matches the solution', () => {
    let state = base
    for (let index = 0; index < 81; index += 1) {
      state = gameReducer(at(state, index), { type: 'enter', value: state.solution[index]! })
    }
    expect(state.status).toBe('solved')
  })

  it('rejects input once solved', () => {
    let state = base
    for (let index = 0; index < 81; index += 1) {
      state = gameReducer(at(state, index), { type: 'enter', value: state.solution[index]! })
    }
    const index = firstEmpty(base)
    const after = gameReducer(at(state, index), { type: 'enter', value: 1 })
    expect(after.values[index]).toBe(state.solution[index])
  })
})

describe('remainingCount', () => {
  it('counts how many of a digit are left to place', () => {
    const index = base.values.findIndex((value, i) => value === 0 && !isGiven(base, i))
    const target = base.solution[index]!
    const before = remainingCount(base, target)
    const after = remainingCount(gameReducer(at(base, index), { type: 'enter', value: target }), target)
    expect(after).toBe(before - 1)
  })
})
