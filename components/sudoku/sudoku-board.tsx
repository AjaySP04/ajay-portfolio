'use client'

import { boxOf, colOf, rowOf } from '@/lib/sudoku/grid'
import { isGiven, isMistake, noteValues, type GameState } from '@/lib/sudoku/game'

/**
 * The grid. Presentational — every decision comes from `state`, so the board has
 * no opinions of its own about the rules.
 */
export function SudokuBoard({
  state,
  paused,
  disabled = false,
  onSelect,
}: {
  state: GameState
  paused: boolean
  disabled?: boolean
  onSelect: (index: number) => void
}) {
  const cursorRow = rowOf(state.cursor)
  const cursorCol = colOf(state.cursor)
  const cursorBox = boxOf(state.cursor)
  const cursorValue = state.values[state.cursor] ?? 0

  return (
    <div className="relative">
      {/* Block dividers as an overlay rather than thicker cell borders: varying
          border widths inside the grid would make columns unequal widths, and a
          colour-only difference at 1px was invisible in both themes. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3"
      >
        {Array.from({ length: 9 }, (_, block) => (
          <div key={block} className="border border-fg/30" />
        ))}
      </div>

      <div
        role="grid"
        aria-label="Sudoku grid"
        aria-rowcount={9}
        aria-colcount={9}
        className="grid w-full grid-cols-9 border-t border-l border-hairline select-none"
      >
        {Array.from({ length: 9 }, (_, row) => (
          // role="grid" requires role="row" children; `display: contents` keeps
          // the cells participating in the 9-column grid regardless.
          <div key={row} role="row" className="contents">
            {Array.from({ length: 9 }, (_, col) => {
              const index = row * 9 + col
              const value = state.values[index] ?? 0
              const given = isGiven(state, index)
              const selected = index === state.cursor
              const inScope = row === cursorRow || col === cursorCol || boxOf(index) === cursorBox
              const sameValue = value !== 0 && value === cursorValue && !selected
              const wrong = state.showMistakes && isMistake(state, index)
              const notes = noteValues(state.notes[index] ?? 0)

              const tone = wrong ? 'text-danger' : given ? 'text-fg' : 'text-link'

              // fg-based tints rather than surface tokens: elevated-vs-canvas is
              // only a few points apart in dark mode, so the row/column/box
              // scope did not read at all.
              const background = selected
                ? 'bg-accent/25'
                : sameValue
                  ? 'bg-accent/12'
                  : inScope
                    ? 'bg-fg/[0.06]'
                    : 'bg-canvas'

              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-label={ariaLabel(row, col, value, given, notes)}
                  aria-selected={selected}
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => onSelect(index)}
                  className={`ease-console relative aspect-square border-r border-b border-hairline ${background} ${tone} font-mono transition-colors duration-100 ${
                    selected ? 'ring-1 ring-accent ring-inset' : ''
                  }`}
                >
                  {paused ? (
                    <span aria-hidden="true" className="text-faint">
                      ·
                    </span>
                  ) : value !== 0 ? (
                    <span
                      className={`text-[clamp(1rem,3.2vw,1.5rem)] ${given ? 'font-semibold' : 'font-normal'}`}
                    >
                      {value}
                    </span>
                  ) : notes.length > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[2px] text-[clamp(0.4rem,1.1vw,0.5rem)] leading-none text-faint"
                    >
                      {Array.from({ length: 9 }, (_, n) => (
                        <span key={n} className="flex items-center justify-center">
                          {notes.includes(n + 1) ? n + 1 : ''}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function ariaLabel(row: number, col: number, value: number, given: boolean, notes: number[]) {
  const position = `Row ${row + 1}, column ${col + 1}`
  if (value !== 0) return `${position}, ${value}${given ? ', given' : ''}`
  if (notes.length > 0) return `${position}, empty, notes ${notes.join(' ')}`
  return `${position}, empty`
}
