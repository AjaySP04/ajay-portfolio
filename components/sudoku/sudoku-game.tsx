'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  CircleCheck,
  Eraser,
  Lightbulb,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  Shuffle,
} from 'lucide-react'
import { SudokuBoard } from '@/components/sudoku/sudoku-board'
import { createGame, gameReducer, remainingCount, type GameState } from '@/lib/sudoku/game'
import { generatePuzzle } from '@/lib/sudoku/generator'
import {
  formatTime,
  loadBestTimes,
  loadGame,
  recordBestTime,
  saveGame,
  type BestTimes,
} from '@/lib/sudoku/persistence'
import { DIFFICULTIES, TECHNIQUE_LABELS, type Difficulty } from '@/lib/sudoku/types'
import { track } from '@/lib/analytics/client'

const BTN =
  'ease-console inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border px-3 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40'
const BTN_OFF = 'border-hairline text-muted hover:border-hairline-strong hover:text-fg'
const BTN_ON = 'border-accent bg-accent text-on-accent'

/**
 * A blank game rendered while the first puzzle generates.
 *
 * Generation happens client-side, so swapping a short "generating" box for the
 * full board shifted the whole page — measured CLS 0.17 against a 0.01 budget.
 * Rendering the real shell from the first paint keeps the layout fixed.
 */
const BLANK_GRID = new Array(81).fill(0)
const PLACEHOLDER_STATE = createGame({
  puzzle: BLANK_GRID,
  solution: BLANK_GRID,
  difficulty: 'easy',
  hardestTechnique: 'nakedSingle',
  techniquesUsed: [],
  clues: 0,
})

/** Reducer wrapper that tolerates the pre-boot null state. */
function reducer(state: GameState | null, action: Parameters<typeof gameReducer>[1]) {
  if (action.type === 'restore') return action.state
  if (!state) return state
  return gameReducer(state, action)
}

export function SudokuGame() {
  const [state, dispatch] = useReducer(reducer, null)
  const [generating, setGenerating] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [best, setBest] = useState<BestTimes>({})
  const boardRef = useRef<HTMLDivElement>(null)
  const recorded = useRef(false)

  const newPuzzle = useCallback(async (target: Difficulty) => {
    setGenerating(true)
    // cooperative: an expert puzzle is seconds of work, and without yielding
    // that freezes the tab.
    const puzzle = await generatePuzzle(target, { cooperative: true })
    dispatch({ type: 'restore', state: createGame(puzzle) })
    setElapsedMs(0)
    setPaused(false)
    recorded.current = false
    setGenerating(false)
    boardRef.current?.focus()
    track('sudoku_started', { difficulty: target, technique: puzzle.hardestTechnique })
  }, [])

  // Restore an autosaved game, or generate a fresh one.
  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setBest(loadBestTimes())

      const saved = loadGame()
      if (saved) {
        setDifficulty(saved.state.difficulty)
        setElapsedMs(saved.elapsedMs)
        dispatch({ type: 'restore', state: saved.state })
        setGenerating(false)
        return
      }

      const puzzle = await generatePuzzle('easy', { cooperative: true })
      if (cancelled) return
      dispatch({ type: 'restore', state: createGame(puzzle) })
      setGenerating(false)
      track('sudoku_started', { difficulty: 'easy', technique: puzzle.hardestTechnique })
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const solved = state?.status === 'solved'

  /**
   * Depends on a boolean, not on `state`.
   *
   * Keying this effect on the game state re-created the interval on every
   * keystroke, so it never survived a full second and the clock stayed at 00:00
   * for anyone actually playing — the one situation it needs to work.
   */
  const clockRunning = Boolean(state) && !paused && !solved && !generating

  useEffect(() => {
    if (!clockRunning) return
    const id = window.setInterval(() => setElapsedMs((ms) => ms + 1000), 1000)
    return () => window.clearInterval(id)
  }, [clockRunning])

  useEffect(() => {
    if (!state) return
    saveGame(state, elapsedMs)
  }, [state, elapsedMs])

  useEffect(() => {
    if (!solved || recorded.current || !state) return
    recorded.current = true
    setBest(recordBestTime(state.difficulty, elapsedMs))
    track('sudoku_completed', {
      difficulty: state.difficulty,
      seconds: Math.round(elapsedMs / 1000),
      hints: state.hintsUsed,
    })
  }, [solved, state, elapsedMs])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!state || generating) return
      const key = event.key

      const moves: Record<string, { dRow: number; dCol: number }> = {
        ArrowUp: { dRow: -1, dCol: 0 },
        ArrowDown: { dRow: 1, dCol: 0 },
        ArrowLeft: { dRow: 0, dCol: -1 },
        ArrowRight: { dRow: 0, dCol: 1 },
      }

      const move = moves[key]
      if (move) {
        event.preventDefault()
        dispatch({ type: 'moveCursor', ...move })
        return
      }

      if (key >= '1' && key <= '9') {
        event.preventDefault()
        dispatch({ type: 'enter', value: Number(key) })
        return
      }

      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        event.preventDefault()
        dispatch({ type: 'clear' })
        return
      }

      switch (key.toLowerCase()) {
        case 'n':
          event.preventDefault()
          dispatch({ type: 'toggleNotesMode' })
          break
        case 'u':
          event.preventDefault()
          dispatch({ type: 'undo' })
          break
        case 'r':
          event.preventDefault()
          dispatch({ type: 'redo' })
          break
        case 'x':
          event.preventDefault()
          dispatch({ type: 'toggleMistakes' })
          break
        case 'p':
          event.preventDefault()
          setPaused((value) => !value)
          break
        default:
          if (key === '?') {
            event.preventDefault()
            dispatch({ type: 'hint' })
          }
          break
      }
    },
    [state, generating],
  )

  const booting = state === null
  const view = state ?? PLACEHOLDER_STATE

  return (
    <div className="rounded-sm border border-hairline bg-elevated/60">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={difficulty === level}
              disabled={generating}
              onClick={() => {
                setDifficulty(level)
                void newPuzzle(level)
              }}
              className={`${BTN} ${difficulty === level ? BTN_ON : BTN_OFF}`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
          <span className="tnum text-fg">{formatTime(elapsedMs)}</span>
          {best[view.difficulty] !== undefined ? (
            <span className="tnum">best {formatTime(best[view.difficulty]!)}</span>
          ) : null}
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            disabled={solved || generating}
            className={`${BTN} ${BTN_OFF}`}
          >
            {paused ? (
              <Play className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Pause className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            )}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="grid gap-px bg-hairline lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="bg-canvas p-4">
          <div
            ref={boardRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-describedby="sudoku-keys"
            className="mx-auto max-w-[32rem] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SudokuBoard
              state={view}
              disabled={booting}
              paused={paused && !solved}
              onSelect={(index) => {
                dispatch({ type: 'setCursor', index })
                boardRef.current?.focus()
              }}
            />
          </div>

          <p
            id="sudoku-keys"
            className="mt-4 text-center font-mono text-[10px] leading-relaxed tracking-[0.1em] text-faint uppercase"
          >
            Arrows move · 1–9 place · N notes · U undo · R redo · X mistakes · P pause · ? hint
          </p>
        </div>

        <div className="flex flex-col gap-4 bg-canvas p-4">
          {solved ? (
            <p className="flex items-start gap-2 rounded-sm border border-live/40 bg-live/[0.07] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-fg">
              <CircleCheck
                className="mt-px size-3.5 shrink-0 text-live"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Solved in {formatTime(elapsedMs)}
              {view.hintsUsed > 0
                ? ` · ${view.hintsUsed} hint${view.hintsUsed === 1 ? '' : 's'}`
                : ''}
            </p>
          ) : null}

          <div>
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
              Digits
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((value) => {
                const left = remainingCount(view, value)
                return (
                  <div key={value} className="relative">
                  <button
                    type="button"
                    disabled={solved || paused || booting}
                    onClick={() => {
                      dispatch({ type: 'enter', value })
                      boardRef.current?.focus()
                    }}
                    aria-label={`Place ${value}, ${left} remaining`}
                    className={`ease-console flex w-full aspect-square items-center justify-center rounded-sm border font-mono text-[16px] transition-colors duration-200 disabled:opacity-40 ${
                      left === 0
                        ? 'border-hairline text-faint'
                        : 'border-hairline text-fg hover:border-accent hover:text-accent-text'
                    }`}
                  >
                    {value}
                  </button>
                  {/* Outside the button on purpose: inside, the button's visible
                      text became "5"+"6" and no longer matched its accessible
                      name, which axe flags as a label mismatch. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-1 bottom-0.5 font-mono text-[9px] text-faint"
                  >
                    {left}
                  </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              aria-pressed={view.notesMode}
              onClick={() => {
                dispatch({ type: 'toggleNotesMode' })
                boardRef.current?.focus()
              }}
              className={`${BTN} ${view.notesMode ? BTN_ON : BTN_OFF}`}
            >
              <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Notes
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'clear' })
                boardRef.current?.focus()
              }}
              disabled={solved}
              className={`${BTN} ${BTN_OFF}`}
            >
              <Eraser className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Erase
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'undo' })}
              disabled={view.past.length === 0}
              className={`${BTN} ${BTN_OFF}`}
            >
              <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Undo
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'redo' })}
              disabled={view.future.length === 0}
              className={`${BTN} ${BTN_OFF}`}
            >
              <RotateCw className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Redo
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'hint' })
                boardRef.current?.focus()
              }}
              disabled={solved || paused}
              className={`${BTN} ${BTN_OFF} col-span-2`}
            >
              <Lightbulb className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Hint
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-muted">
            <input
              type="checkbox"
              checked={view.showMistakes}
              onChange={() => dispatch({ type: 'toggleMistakes' })}
              className="size-3.5 accent-[var(--color-accent)]"
            />
            Highlight mistakes
          </label>

          <dl className="mt-auto space-y-2 border-t border-hairline pt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Clues</dt>
              <dd className="tnum text-muted">{view.clues}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Requires</dt>
              <dd className="text-right text-muted normal-case">
                {TECHNIQUE_LABELS[view.hardestTechnique]}
              </dd>
            </div>
            {view.lastHint ? (
              <div className="flex justify-between gap-2">
                <dt className="text-faint">Last hint</dt>
                <dd className="text-right text-accent-text normal-case">
                  {TECHNIQUE_LABELS[view.lastHint]}
                </dd>
              </div>
            ) : null}
          </dl>

          <button
            type="button"
            disabled={generating}
            onClick={() => void newPuzzle(difficulty)}
            className={`${BTN} ${BTN_OFF} w-full`}
          >
            <Shuffle className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {generating ? 'Generating…' : 'New puzzle'}
          </button>

          <span aria-live="polite" className="sr-only">
            {generating ? 'Generating a new puzzle' : solved ? 'Puzzle solved' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
