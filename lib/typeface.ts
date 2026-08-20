/**
 * The typeface, in one place.
 *
 * Colour already works this way (`app/globals.css` + `lib/palette.ts`), and the
 * font needs the same treatment for the same reason: it will be swapped again,
 * and a value spread across five files is a value that gets half-changed.
 *
 * **To change the site's typeface, edit exactly two things:**
 *
 *   1. The family imported in `app/fonts.ts` — e.g. swap `Open_Sans` for `Lato`.
 *   2. `ogPackage` and `ogFamily` below, plus the matching `@fontsource/*`
 *      devDependency.
 *
 * Nothing else. `app/globals.css` references the CSS variable by a
 * family-agnostic name (`--font-site`), `app/layout.tsx` hangs whatever
 * `app/fonts.ts` exports, and `next.config.ts` traces fontsource by wildcard
 * rather than by package name — so none of the three needs touching.
 *
 * That variable name is **not** exported from here, deliberately. next/font is a
 * build-time AST transform and rejects any non-literal option, so `app/fonts.ts`
 * must write `'--font-site'` inline. Re-exporting it would create a second copy
 * that looks authoritative, is never read, and drifts.
 *
 * Zero-dependency on purpose: `lib/og.tsx` imports this, and pulling
 * `next/font` into that module would drag a build-time transform into a route
 * that only needs a filename.
 */
export const typeface = {
  /**
   * The `@fontsource/*` package Satori reads from. The site itself is served by
   * next/font; this exists only because Satori cannot use a system font or a
   * next/font handle — it needs an actual file on disk, and it accepts
   * ttf/otf/woff but **not woff2**.
   */
  ogPackage: 'lato',

  /** The family name Satori registers the file under. */
  ogFamily: 'Lato',
} as const
