import type { Grid } from './types'

export const SIZE = 9
export const CELLS = 81

export const rowOf = (index: number) => Math.floor(index / SIZE)
export const colOf = (index: number) => index % SIZE
export const boxOf = (index: number) =>
  Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3)

function buildUnits() {
  const rows: number[][] = []
  const cols: number[][] = []
  const boxes: number[][] = []

  for (let i = 0; i < SIZE; i += 1) {
    rows.push(Array.from({ length: SIZE }, (_, j) => i * SIZE + j))
    cols.push(Array.from({ length: SIZE }, (_, j) => j * SIZE + i))
  }

  for (let box = 0; box < SIZE; box += 1) {
    const startRow = Math.floor(box / 3) * 3
    const startCol = (box % 3) * 3
    const cells: number[] = []
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) cells.push((startRow + r) * SIZE + startCol + c)
    }
    boxes.push(cells)
  }

  return { rows, cols, boxes }
}

const built = buildUnits()

export const ROWS: readonly number[][] = built.rows
export const COLS: readonly number[][] = built.cols
export const BOXES: readonly number[][] = built.boxes
/** Rows, then columns, then boxes — 27 units. */
export const UNITS: readonly number[][] = [...built.rows, ...built.cols, ...built.boxes]

/** The 20 cells that constrain each cell. Precomputed once; hot in the solver. */
export const PEERS: readonly Set<number>[] = Array.from({ length: CELLS }, (_, index) => {
  const peers = new Set<number>([
    ...ROWS[rowOf(index)]!,
    ...COLS[colOf(index)]!,
    ...BOXES[boxOf(index)]!,
  ])
  peers.delete(index)
  return peers
})

/** Units containing each cell, for technique scanning. */
export const UNITS_OF: readonly number[][][] = Array.from({ length: CELLS }, (_, index) => [
  ROWS[rowOf(index)]!,
  COLS[colOf(index)]!,
  BOXES[boxOf(index)]!,
])

export function emptyGrid(): Grid {
  return new Array(CELLS).fill(0)
}

/** Could `value` go at `index` without clashing with a peer? */
export function isValidPlacement(grid: Grid, index: number, value: number): boolean {
  for (const peer of PEERS[index]!) {
    if (grid[peer] === value) return false
  }
  return true
}

export function serializeGrid(grid: Grid): string {
  return grid.map((value) => (value === 0 ? '0' : String(value))).join('')
}

export function parseGrid(input: string): Grid {
  const cleaned = input.trim()
  if (cleaned.length !== CELLS) {
    throw new Error(`Expected ${CELLS} characters, received ${cleaned.length}`)
  }
  return [...cleaned].map((char) => {
    if (char === '.' || char === '0' || char === '-') return 0
    const value = Number(char)
    if (!Number.isInteger(value) || value < 1 || value > 9) {
      throw new Error(`Unexpected character in grid: ${char}`)
    }
    return value
  })
}
