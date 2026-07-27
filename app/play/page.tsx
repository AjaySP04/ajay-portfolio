import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { games } from '@/content/games'

export const metadata: Metadata = {
  title: 'Games',
  description:
    'Small, lightweight browser games built by Ajay Singh Parmar — starting with a keyboard-first sudoku whose generator guarantees a unique solution.',
  alternates: { canonical: '/play' },
  openGraph: { type: 'website', url: '/play', title: 'Games' },
}

export default function PlayPage() {
  return (
    <>
      <PageHeader
        kicker="Games"
        title="Small things, built properly"
        intro="Lightweight browser games — no accounts, no loading screens, nothing phoning home. One for now; more when something is worth building."
      />

      <div className="mx-auto max-w-6xl px-6 pb-8">
        {/* Two columns only once there is something to put in the second one —
            a lone card in a 2-up grid reads as a page that failed to load. */}
        <ul
          className={`grid gap-6 ${games.length > 1 ? 'lg:grid-cols-2' : 'max-w-2xl'}`}
        >
          {games.map((game) => (
            <li key={game.slug}>
              <article className="flex h-full flex-col rounded-sm border border-hairline bg-canvas">
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase">
                  <span className="inline-flex items-center gap-2 text-fg">
                    <span
                      className={`size-1.5 rounded-full ${
                        game.status === 'live' ? 'bg-live' : 'bg-accent'
                      }`}
                      aria-hidden="true"
                    />
                    {game.status}
                  </span>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <h2 className="font-mono text-[17px] font-medium tracking-tight text-fg">
                      <Link
                        href={game.href}
                        className="ease-console transition-colors duration-200 hover:text-accent-text"
                      >
                        {game.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{game.tagline}</p>
                  </div>

                  <ul className="mt-auto space-y-1.5">
                    {game.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-2.5 font-mono text-[11px] text-muted"
                      >
                        <span
                          className="mt-[5px] size-1 shrink-0 rotate-45 bg-faint"
                          aria-hidden="true"
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="border-t border-hairline px-4 py-3">
                  <Link
                    href={game.href}
                    className="ease-console inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
                  >
                    Play {game.title}
                    <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
