import { Lato } from 'next/font/google'

/**
 * The site's typeface, downloaded and self-hosted at build time — no request
 * ever leaves for fonts.gstatic.com, and the @font-face CSS is inlined so there
 * is no layout shift to pay for.
 *
 * A webfont is a deliberate step back from the system Helvetica/Arial stack this
 * briefly used. That stack cost zero bytes but rendered differently on every OS
 * and offered only two real weights; a self-hosted face is identical everywhere
 * and gives the full weight range the labels and headings actually use.
 *
 * Lato is **not** a variable font, so weights are explicit. Only 400 and 700
 * are requested: those are the two the site actually sets, and each extra cut is
 * another file on the critical path. Italic is deliberately not requested —
 * nothing here sets it, and it would double the download for no benefit.
 *
 * Note that Lato has no 600. Tailwind's `font-semibold` therefore resolves to
 * the nearest heavier cut (700) rather than synthesising a mid-weight, which is
 * why labels and headings read slightly bolder than they did in a variable
 * face. That is the intended look here, not a bug to patch with `font-medium`.
 *
 * **To swap the family, change the import and the call below, then update
 * `lib/typeface.ts` and the `@fontsource/*` devDependency.** The CSS variable
 * name is family-agnostic, so `globals.css` and `layout.tsx` stay untouched.
 *
 * `variable` has to be an inline string literal, not `typeface.cssVariable`.
 * next/font is a build-time transform that reads these options out of the AST,
 * so every value must be an explicit literal — a module reference fails the
 * build with "Font loader values must be explicitly written literals". That is
 * also why the family cannot be selected dynamically.
 */
export const siteFont = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-site',
})
