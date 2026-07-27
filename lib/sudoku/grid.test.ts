import { describe, expect, it } from 'vitest'
import { BOXES, COLS, PEERS, ROWS, UNITS, boxOf, colOf, isValidPlacement, parseGrid, rowOf, serializeGrid } from './grid'

describe('grid geometry', () => {
  it('has 27 units of 9 cells each', () => {
    expect(UNITS).toHaveLength(27)
    for (const unit of UNITS) expect(unit).toHaveLength(9)
  })

  it('splits into 9 rows, 9 columns and 9 boxes', () => {
    expect(ROWS).toHaveLength(9)
    expect(COLS).toHaveLength(9)
    expect(BOXES).toHaveLength(9)
    expect(ROWS[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(COLS[0]).toEqual([0, 9, 18, 27, 36, 45, 54, 63, 72])
    expect(BOXES[0]).toEqual([0, 1, 2, 9, 10, 11, 18, 19, 20])
  })

  it('covers every cell exactly three times across all units', () => {
    const seen = new Array(81).fill(0)
    for (const unit of UNITS) for (const index of unit) seen[index] += 1
    expect(seen.every((count) => count === 3)).toBe(true)
  })

  it('gives every cell exactly 20 peers, never including itself', () => {
    for (let index = 0; index < 81; index += 1) {
      const peers = PEERS[index]!
      expect(peers.size).toBe(20)
      expect(peers.has(index)).toBe(false)
    }
  })

  it('derives row, column and box indices', () => {
    expect(rowOf(0)).toBe(0)
    expect(colOf(0)).toBe(0)
    expect(boxOf(0)).toBe(0)
    expect(rowOf(80)).toBe(8)
    expect(colOf(80)).toBe(8)
    expect(boxOf(80)).toBe(8)
    expect(boxOf(30)).toBe(4)
  })

  it('peers of a cell are exactly its row, column and box, minus itself', () => {
    const index = 40
    const expected = new Set<number>([...ROWS[4]!, ...COLS[4]!, ...BOXES[4]!])
    expected.delete(index)
    expect(PEERS[index]).toEqual(expected)
  })
})

describe('isValidPlacement', () => {
  it('rejects a digit already present in the row, column or box', () => {
    const grid = new Array(81).fill(0)
    grid[0] = 5
    expect(isValidPlacement(grid, 1, 5)).toBe(false) // same row
    expect(isValidPlacement(grid, 9, 5)).toBe(false) // same column
    expect(isValidPlacement(grid, 10, 5)).toBe(false) // same box
    expect(isValidPlacement(grid, 80, 5)).toBe(true) // unrelated
  })

  it('ignores the cell being placed into', () => {
    const grid = new Array(81).fill(0)
    grid[0] = 5
    expect(isValidPlacement(grid, 0, 5)).toBe(true)
  })
})

describe('serialization', () => {
  it('round-trips a grid through a string', () => {
    const grid = Array.from({ length: 81 }, (_, i) => (i % 10 === 0 ? 0 : (i % 9) + 1))
    expect(parseGrid(serializeGrid(grid))).toEqual(grid)
  })

  it('accepts dots as empty cells', () => {
    const serialized = '.'.repeat(81)
    expect(parseGrid(serialized)).toEqual(new Array(81).fill(0))
  })

  it('rejects strings of the wrong length', () => {
    expect(() => parseGrid('123')).toThrow()
  })
})
