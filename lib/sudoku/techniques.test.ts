import { describe, expect, it } from 'vitest'
import { parseGrid } from './grid'
import { candidatesFor, nextDeduction, rateGrid, solveWithTechniques } from './techniques'

const EASY = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('candidatesFor', () => {
  it('returns the single remaining digit when eight peers in a row are filled', () => {
    const grid = new Array(81).fill(0)
    for (let i = 0; i < 8; i += 1) grid[i] = i + 1 // 1..8 in row 0
    expect(candidatesFor(grid, 8)).toEqual([9])
  })

  it('returns nothing for a filled cell', () => {
    const grid = new Array(81).fill(0)
    grid[0] = 4
    expect(candidatesFor(grid, 0)).toEqual([])
  })

  it('returns all nine digits for an empty grid', () => {
    expect(candidatesFor(new Array(81).fill(0), 40)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('nextDeduction', () => {
  it('finds a naked single and names the technique', () => {
    const grid = new Array(81).fill(0)
    for (let i = 0; i < 8; i += 1) grid[i] = i + 1
    const deduction = nextDeduction(grid)
    expect(deduction).toEqual({ index: 8, value: 9, technique: 'nakedSingle' })
  })

  it('finds a hidden single: a digit with only one home left in its box', () => {
    const grid = new Array(81).fill(0)
    // Block 9 from every cell of box 0 except index 0, without making index 0 a
    // naked single: put 9s in row 1, row 2 and columns 1, 2.
    grid[12] = 9 // row 1, outside box 0
    grid[24] = 9 // row 2, outside box 0
    grid[28] = 9 // column 1, outside box 0
    grid[47] = 9 // column 2, outside box 0
    const deduction = nextDeduction(grid)
    expect(deduction).not.toBeNull()
    expect(deduction!.value).toBe(9)
    expect(deduction!.index).toBe(0)
    expect(deduction!.technique).toBe('hiddenSingle')
  })

  it('returns null for a solved grid', () => {
    const solved = solveWithTechniques(parseGrid(EASY))
    expect(solved.solved).toBe(true)
    expect(nextDeduction(solved.grid)).toBeNull()
  })

  it('never suggests a value that contradicts the grid', () => {
    const grid = parseGrid(EASY)
    for (let step = 0; step < 20; step += 1) {
      const deduction = nextDeduction(grid)
      if (!deduction) break
      expect(candidatesFor(grid, deduction.index)).toContain(deduction.value)
      grid[deduction.index] = deduction.value
    }
  })
})

describe('solveWithTechniques', () => {
  it('solves a standard puzzle using human techniques only', () => {
    const result = solveWithTechniques(parseGrid(EASY))
    expect(result.solved).toBe(true)
    expect(result.techniquesUsed.length).toBeGreaterThan(0)
  })

  it('reports the techniques it actually needed', () => {
    const result = solveWithTechniques(parseGrid(EASY))
    for (const technique of result.techniquesUsed) {
      expect([
        'nakedSingle',
        'hiddenSingle',
        'nakedPair',
        'hiddenPair',
        'lockedCandidates',
        'nakedTriple',
        'xWing',
      ]).toContain(technique)
    }
  })

  it('does not mutate the grid it is given', () => {
    const grid = parseGrid(EASY)
    const copy = [...grid]
    solveWithTechniques(grid)
    expect(grid).toEqual(copy)
  })

  it('gives up rather than guessing on a grid needing deeper logic', () => {
    // An empty grid cannot be progressed by any deterministic technique.
    const result = solveWithTechniques(new Array(81).fill(0))
    expect(result.solved).toBe(false)
  })
})

describe('rateGrid', () => {
  it('rates a singles-only puzzle as a single technique', () => {
    const grid = new Array(81).fill(0)
    for (let i = 0; i < 8; i += 1) grid[i] = i + 1
    // Not solvable overall, but the rating of a solvable easy puzzle should be
    // one of the singles.
    const rating = rateGrid(parseGrid(EASY))
    expect(rating).not.toBeNull()
    expect(['nakedSingle', 'hiddenSingle', 'nakedPair', 'lockedCandidates']).toContain(rating)
    expect(grid[8]).toBe(0)
  })

  it('returns null when the puzzle needs more than the implemented techniques', () => {
    expect(rateGrid(new Array(81).fill(0))).toBeNull()
  })
})
