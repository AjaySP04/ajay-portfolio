import { BOXES, CELLS, COLS, PEERS, ROWS, UNITS, boxOf } from './grid'
import type { Deduction, Grid, Technique } from './types'
import { TECHNIQUES } from './types'

const ALL = 0b111111111
const bit = (value: number) => 1 << (value - 1)

/** Candidate bitmasks per cell; 0 for a filled cell. */
type Candidates = number[]

function maskValues(mask: number): number[] {
  const values: number[] = []
  for (let value = 1; value <= 9; value += 1) {
    if (mask & bit(value)) values.push(value)
  }
  return values
}

function popcount(mask: number): number {
  let count = 0
  let m = mask
  while (m) {
    m &= m - 1
    count += 1
  }
  return count
}

function computeCandidates(grid: Grid): Candidates {
  const candidates: Candidates = new Array(CELLS).fill(0)
  for (let index = 0; index < CELLS; index += 1) {
    if (grid[index] !== 0) continue
    let mask = ALL
    for (const peer of PEERS[index]!) {
      const value = grid[peer]
      if (value) mask &= ~bit(value)
    }
    candidates[index] = mask
  }
  return candidates
}

/** Candidates from the grid alone, ignoring any deductions. */
export function candidatesFor(grid: Grid, index: number): number[] {
  if (grid[index] !== 0) return []
  let mask = ALL
  for (const peer of PEERS[index]!) {
    const value = grid[peer]
    if (value) mask &= ~bit(value)
  }
  return maskValues(mask)
}

/**
 * Place a value and narrow peers in place, rather than recomputing from the
 * grid — recomputation would throw away eliminations that earlier techniques
 * worked for.
 */
function place(grid: Grid, candidates: Candidates, index: number, value: number) {
  grid[index] = value
  candidates[index] = 0
  for (const peer of PEERS[index]!) {
    candidates[peer] = (candidates[peer] ?? 0) & ~bit(value)
  }
}

function findNakedSingle(grid: Grid, candidates: Candidates): Deduction | null {
  for (let index = 0; index < CELLS; index += 1) {
    if (grid[index] !== 0) continue
    const mask = candidates[index]!
    if (popcount(mask) === 1) {
      return { index, value: maskValues(mask)[0]!, technique: 'nakedSingle' }
    }
  }
  return null
}

function findHiddenSingle(grid: Grid, candidates: Candidates): Deduction | null {
  for (const unit of UNITS) {
    for (let value = 1; value <= 9; value += 1) {
      let alreadyPlaced = false
      let home = -1
      let count = 0
      for (const index of unit) {
        if (grid[index] === value) {
          alreadyPlaced = true
          break
        }
        if (grid[index] === 0 && candidates[index]! & bit(value)) {
          count += 1
          home = index
        }
      }
      if (!alreadyPlaced && count === 1) {
        return { index: home, value, technique: 'hiddenSingle' }
      }
    }
  }
  return null
}

/** Two cells in a unit holding the same pair — no one else in the unit can use it. */
function applyNakedPair(grid: Grid, candidates: Candidates): boolean {
  let changed = false
  for (const unit of UNITS) {
    const pairs = unit.filter((i) => grid[i] === 0 && popcount(candidates[i]!) === 2)
    for (let a = 0; a < pairs.length; a += 1) {
      for (let b = a + 1; b < pairs.length; b += 1) {
        const first = pairs[a]!
        const second = pairs[b]!
        const mask = candidates[first]!
        if (mask !== candidates[second]!) continue
        for (const index of unit) {
          if (index === first || index === second || grid[index] !== 0) continue
          const before = candidates[index]!
          const after = before & ~mask
          if (after !== before) {
            candidates[index] = after
            changed = true
          }
        }
      }
    }
  }
  return changed
}

/** Two values confined to the same two cells — those cells hold nothing else. */
function applyHiddenPair(grid: Grid, candidates: Candidates): boolean {
  let changed = false
  for (const unit of UNITS) {
    const homes = new Map<number, number[]>()
    for (let value = 1; value <= 9; value += 1) {
      const cells = unit.filter((i) => grid[i] === 0 && candidates[i]! & bit(value))
      if (cells.length === 2) homes.set(value, cells)
    }
    const entries = [...homes.entries()]
    for (let a = 0; a < entries.length; a += 1) {
      for (let b = a + 1; b < entries.length; b += 1) {
        const [valueA, cellsA] = entries[a]!
        const [valueB, cellsB] = entries[b]!
        if (cellsA[0] !== cellsB[0] || cellsA[1] !== cellsB[1]) continue
        const keep = bit(valueA) | bit(valueB)
        for (const index of cellsA) {
          const before = candidates[index]!
          const after = before & keep
          if (after !== before) {
            candidates[index] = after
            changed = true
          }
        }
      }
    }
  }
  return changed
}

/**
 * Locked candidates, both directions:
 *  - pointing: a value confined to one row/column inside a box leaves that
 *    row/column elsewhere.
 *  - claiming: a value confined to one box inside a row/column leaves the rest
 *    of that box.
 */
function applyLockedCandidates(grid: Grid, candidates: Candidates): boolean {
  let changed = false

  const eliminate = (cells: readonly number[], value: number, keep: Set<number>) => {
    for (const index of cells) {
      if (keep.has(index) || grid[index] !== 0) continue
      const before = candidates[index]!
      const after = before & ~bit(value)
      if (after !== before) {
        candidates[index] = after
        changed = true
      }
    }
  }

  for (let box = 0; box < 9; box += 1) {
    const cells = BOXES[box]!
    for (let value = 1; value <= 9; value += 1) {
      const homes = cells.filter((i) => grid[i] === 0 && candidates[i]! & bit(value))
      if (homes.length < 2) continue

      const rows = new Set(homes.map((i) => Math.floor(i / 9)))
      if (rows.size === 1) {
        eliminate(ROWS[[...rows][0]!]!, value, new Set(homes))
      }
      const cols = new Set(homes.map((i) => i % 9))
      if (cols.size === 1) {
        eliminate(COLS[[...cols][0]!]!, value, new Set(homes))
      }
    }
  }

  for (const line of [...ROWS, ...COLS]) {
    for (let value = 1; value <= 9; value += 1) {
      const homes = line.filter((i) => grid[i] === 0 && candidates[i]! & bit(value))
      if (homes.length < 2) continue
      const boxes = new Set(homes.map((i) => boxOf(i)))
      if (boxes.size === 1) {
        eliminate(BOXES[[...boxes][0]!]!, value, new Set(homes))
      }
    }
  }

  return changed
}

/** Three cells in a unit sharing three candidates between them. */
function applyNakedTriple(grid: Grid, candidates: Candidates): boolean {
  let changed = false
  for (const unit of UNITS) {
    const open = unit.filter((i) => {
      const size = popcount(candidates[i]!)
      return grid[i] === 0 && size >= 2 && size <= 3
    })
    for (let a = 0; a < open.length; a += 1) {
      for (let b = a + 1; b < open.length; b += 1) {
        for (let c = b + 1; c < open.length; c += 1) {
          const trio = [open[a]!, open[b]!, open[c]!]
          const union = candidates[trio[0]!]! | candidates[trio[1]!]! | candidates[trio[2]!]!
          if (popcount(union) !== 3) continue
          for (const index of unit) {
            if (trio.includes(index) || grid[index] !== 0) continue
            const before = candidates[index]!
            const after = before & ~union
            if (after !== before) {
              candidates[index] = after
              changed = true
            }
          }
        }
      }
    }
  }
  return changed
}

/**
 * X-Wing: a value with exactly two homes in each of two lines, aligned on the
 * same pair of cross-lines, eliminates that value elsewhere on the cross-lines.
 */
function applyXWing(grid: Grid, candidates: Candidates): boolean {
  let changed = false

  const scan = (lines: readonly number[][], crossIndex: (cell: number) => number, crosses: readonly number[][]) => {
    for (let value = 1; value <= 9; value += 1) {
      const pairs: { line: number; cells: number[] }[] = []
      lines.forEach((line, lineNumber) => {
        const homes = line.filter((i) => grid[i] === 0 && candidates[i]! & bit(value))
        if (homes.length === 2) pairs.push({ line: lineNumber, cells: homes })
      })

      for (let a = 0; a < pairs.length; a += 1) {
        for (let b = a + 1; b < pairs.length; b += 1) {
          const first = pairs[a]!
          const second = pairs[b]!
          const crossA = first.cells.map(crossIndex)
          const crossB = second.cells.map(crossIndex)
          if (crossA[0] !== crossB[0] || crossA[1] !== crossB[1]) continue

          const keep = new Set([...first.cells, ...second.cells])
          for (const cross of crossA) {
            for (const index of crosses[cross!]!) {
              if (keep.has(index) || grid[index] !== 0) continue
              const before = candidates[index]!
              const after = before & ~bit(value)
              if (after !== before) {
                candidates[index] = after
                changed = true
              }
            }
          }
        }
      }
    }
  }

  scan(ROWS, (cell) => cell % 9, COLS)
  scan(COLS, (cell) => Math.floor(cell / 9), ROWS)
  return changed
}

const ELIMINATORS: { technique: Technique; apply: (g: Grid, c: Candidates) => boolean }[] = [
  { technique: 'nakedPair', apply: applyNakedPair },
  { technique: 'hiddenPair', apply: applyHiddenPair },
  { technique: 'lockedCandidates', apply: applyLockedCandidates },
  { technique: 'nakedTriple', apply: applyNakedTriple },
  { technique: 'xWing', apply: applyXWing },
]

export type TechniqueSolveResult = {
  grid: Grid
  solved: boolean
  techniquesUsed: Technique[]
}

/**
 * Solve using only deterministic human techniques — never guessing. If it gets
 * stuck, it says so; that is what separates an `expert` rating from a puzzle
 * that simply cannot be reasoned through.
 */
export function solveWithTechniques(grid: Grid): TechniqueSolveResult {
  const working = [...grid]
  const candidates = computeCandidates(working)
  const used = new Set<Technique>()

  for (;;) {
    if (!working.includes(0)) break

    // A blank cell with no candidates means the grid contradicts itself.
    let dead = false
    for (let index = 0; index < CELLS; index += 1) {
      if (working[index] === 0 && candidates[index] === 0) {
        dead = true
        break
      }
    }
    if (dead) break

    const single = findNakedSingle(working, candidates) ?? findHiddenSingle(working, candidates)
    if (single) {
      used.add(single.technique)
      place(working, candidates, single.index, single.value)
      continue
    }

    let progressed = false
    for (const { technique, apply } of ELIMINATORS) {
      if (apply(working, candidates)) {
        used.add(technique)
        progressed = true
        break
      }
    }
    if (!progressed) break
  }

  const techniquesUsed = TECHNIQUES.filter((technique) => used.has(technique))
  return { grid: working, solved: !working.includes(0), techniquesUsed }
}

/**
 * The next placement a player could justify, for the hint button.
 *
 * When only an elimination is available, the technique reported is the
 * elimination that unlocked the placement — that is the useful thing to name,
 * rather than the trivial single it produced.
 */
export function nextDeduction(grid: Grid): Deduction | null {
  const working = [...grid]
  const candidates = computeCandidates(working)

  const direct = findNakedSingle(working, candidates) ?? findHiddenSingle(working, candidates)
  if (direct) return direct

  for (const { technique, apply } of ELIMINATORS) {
    if (!apply(working, candidates)) continue
    const unlocked = findNakedSingle(working, candidates) ?? findHiddenSingle(working, candidates)
    if (unlocked) return { ...unlocked, technique }
  }

  return null
}

/** Hardest technique required, or null if human techniques cannot finish it. */
export function rateGrid(grid: Grid): Technique | null {
  const result = solveWithTechniques(grid)
  if (!result.solved) return null
  let hardest: Technique = 'nakedSingle'
  for (const technique of result.techniquesUsed) {
    if (TECHNIQUES.indexOf(technique) > TECHNIQUES.indexOf(hardest)) hardest = technique
  }
  return hardest
}
