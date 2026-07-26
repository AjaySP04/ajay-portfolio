import type { ReactNode } from 'react'

/** Heading block for the routes that are not the homepage. */
export function PageHeader({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string
  title: string
  intro?: string
  children?: ReactNode
}) {
  return (
    <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-20">
      <p className="font-mono text-[11px] tracking-[0.18em] text-accent-text uppercase">
        {kicker}
      </p>
      <h1 className="mt-4 font-mono text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-fg">
        {title}
      </h1>
      {intro ? (
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
          {intro}
        </p>
      ) : null}
      {children}
    </header>
  )
}
