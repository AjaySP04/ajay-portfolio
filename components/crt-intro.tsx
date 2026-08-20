/**
 * The power-on intro: graphite shutters part from a white beam.
 *
 * A server component with zero JavaScript, and that is the whole point. The
 * animation has to be running at first paint — a client-driven version paints
 * the finished page, hydrates, and only then plays the intro, which reads worse
 * than having none at all.
 *
 * It is an overlay rather than a transform on the page, and that is not a style
 * choice. Scaling the page wrapper from a line to full height would make it the
 * containing block for `position: fixed` descendants, which breaks the orb
 * canvas (`fixed inset-0`) and the sticky header — permanently, not just for the
 * duration. So the real page renders at full size underneath and this retracts
 * off the top and bottom.
 *
 * Every visual detail lives in globals.css so the greys stay in the token
 * block with the rest of the palette.
 */
export function CrtIntro() {
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt-shutter crt-top" />
      <div className="crt-shutter crt-bottom" />
      <div className="crt-beam" />
    </div>
  )
}
