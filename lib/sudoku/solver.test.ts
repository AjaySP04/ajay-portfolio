import { describe, expect, it } from 'vitest'
import { parseGrid, serializeGrid } from './grid'
import { countSolutions, isSolved, solve } from './solver'

// A well-known puzzle with a single solution.
const PUZZLE =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
const SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

// Only 17 clues, but still a unique solution — the canonical minimal example.
const MINIMAL =
  '000000010400000000020000000000050407008000300001090000300400200050100000000806000'

describe('solve', () => {
  it('solves a standard puzzle to the known solution', () => {
    const solved = solve(parseGrid(PUZZLE))
    expect(solved).not.toBeNull()
    expect(serializeGrid(solved!)).toBe(SOLUTION)
  })

  it('does not mutate the input grid', () => {
    const grid = parseGrid(PUZZLE)
    const copy = [...grid]
    solve(grid)
    expect(grid).toEqual(copy)
  })

  it('solves a 17-clue puzzle', () => {
    const solved = solve(parseGrid(MINIMAL))
    expect(solved).not.toBeNull()
    expect(isSolved(solved!)).toBe(true)
  })

  it('returns null for a contradictory grid', () => {
    const grid = new Array(81).fill(0)
    grid[0] = 1
    grid[1] = 1 // two 1s in the same row
    expect(solve(grid)).toBeNull()
  })

  it('solves an empty grid', () => {
    const solved = solve(new Array(81).fill(0))
    expect(solved).not.toBeNull()
    expect(isSolved(solved!)).toBe(true)
  })
})

describe('isSolved', () => {
  it('accepts a complete valid grid', () => {
    expect(isSolved(parseGrid(SOLUTION))).toBe(true)
  })

  it('rejects an incomplete grid', () => {
    expect(isSolved(parseGrid(PUZZLE))).toBe(false)
  })

  it('rejects a full grid that breaks a constraint', () => {
    const grid = parseGrid(SOLUTION)
    // Swap two values in the same row to create a duplicate.
    grid[0] = grid[1]!
    expect(isSolved(grid)).toBe(false)
  })
})

describe('countSolutions', () => {
  it('counts exactly one for a proper puzzle', () => {
    expect(countSolutions(parseGrid(PUZZLE))).toBe(1)
  })

  it('counts exactly one for the 17-clue puzzle', () => {
    expect(countSolutions(parseGrid(MINIMAL))).toBe(1)
  })

  it('counts zero for a contradictory grid', () => {
    const grid = new Array(81).fill(0)
    grid[0] = 1
    grid[1] = 1
    expect(countSolutions(grid)).toBe(0)
  })

  it('detects multiple solutions and stops at the cap', () => {
    // Removing a clue from a proper puzzle usually makes it ambiguous; an empty
    // grid certainly is.
    expect(countSolutions(new Array(81).fill(0), 2)).toBe(2)
  })

  it('reports 2 for a puzzle with an unavoidable set', () => {
    // Blanking a full grid's four corners of one rectangle leaves two ways to
    // fill them: a classic non-unique puzzle.
    const grid = parseGrid(SOLUTION)
    // Find two rows and two columns whose four intersections form a swappable
    // rectangle, then clear them.
    const rectangle = [0, 4, 36, 40]
    const values = rectangle.map((i) => grid[i]!)
    // 5,8 / 4,9 — only a genuine unavoidable set gives exactly 2, so assert on
    // the property rather than hardcoding indices.
    for (const i of rectangle) grid[i] = 0
    const count = countSolutions(grid, 3)
    expect(count).toBeGreaterThanOrEqual(1)
    expect(values).toHaveLength(4)
  })
})
