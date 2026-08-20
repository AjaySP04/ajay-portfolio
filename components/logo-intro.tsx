import { LogoWheel } from '@/components/logo'

/**
 * The page-load intro: the monogram spins up at centre, then opens outward as a
 * circle and the page comes through it. 800ms.
 *
 * A server component with zero JavaScript, and that is the whole point. The
 * animation has to be running at first paint — a client-driven version paints
 * the finished page, hydrates, and only then plays the intro, which reads worse
 * than having none at all.
 *
 * It is an overlay rather than a transform on the page, and that is not a style
 * choice. Transforming the page wrapper would make it the containing block for
 * `position: fixed` descendants, which breaks the orb canvas (`fixed inset-0`)
 * and the sticky header — permanently, not just for the duration.
 *
 * Every visual detail lives in globals.css so the greys stay in the token block
 * with the rest of the palette.
 */
export function LogoIntro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-ground" />
      <div className="intro-wheel">
        <LogoWheel className="intro-wheel-spin size-full text-[color:var(--intro-mark)]" />
      </div>
    </div>
  )
}
