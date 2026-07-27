import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SudokuGame } from '@/components/sudoku/sudoku-game'

export const metadata: Metadata = {
  title: 'Sudoku',
  description:
    'A keyboard-first sudoku with a generator that guarantees a unique solution and rates difficulty by the solving technique required, not by clue count.',
}

export default function SudokuPage() {
  return (
    <>
      <PageHeader
        kicker="Play"
        title="Sudoku"
        intro="Every puzzle is generated in the browser with exactly one solution, proved by an independent solver before you ever see it. Difficulty is the hardest technique needed to finish — clue count is a poor proxy for how hard a grid actually plays."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-6 pb-8">
        <SudokuGame />

        <Link
          href="/play"
          className="ease-console inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent-text"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          All games
        </Link>
      </div>
    </>
  )
}
