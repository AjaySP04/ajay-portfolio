import type { ReactNode } from 'react'

/**
 * Consistent section shell: the anchor id, the shared measure, and the
 * scroll-margin that stops the sticky header from covering a heading when you
 * arrive from the nav.
 */
export function Section({
  id,
  children,
  className = '',
}: {
  id: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      // Picked up by the analytics provider's IntersectionObserver.
      data-track-section={id}
      aria-labelledby={`${id}-heading`}
      className={`mx-auto max-w-6xl scroll-mt-20 px-6 ${className}`}
    >
      {children}
    </section>
  )
}
