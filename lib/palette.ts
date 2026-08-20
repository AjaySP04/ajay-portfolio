/**
 * The light palette, in TypeScript.
 *
 * `app/globals.css` is the authority for colour at runtime — the browser reads
 * it, the orb canvas reads it, the CRT intro reads it. But two consumers cannot
 * read CSS custom properties and need the values as data:
 *
 *   - `viewport.themeColor` in `app/layout.tsx`, which the browser applies to
 *     its own chrome before any stylesheet is parsed.
 *   - `lib/og.tsx`, which renders social cards server-side through Satori and
 *     has no document to compute styles against.
 *
 * Both used to hardcode their own hexes, which meant a re-theme silently left
 * the browser chrome and every social card on the old palette. This module is
 * the fix: one place to mirror, and any future theme edit touches exactly two
 * files — the CSS block and this one.
 *
 * Deliberately zero-dependency. It gets imported by a route that also imports
 * `content/site.ts`, and anything that drags zod toward a client bundle is a
 * measured 66KB mistake (see CLAUDE.md §11).
 *
 * Light only. Themes are class-based rather than derived from the OS, so there
 * is no correct dark value to give the browser before hydration — and a social
 * card has no viewer preference to honour at all.
 */
export const palette = {
  canvas: '#F6FDFF',
  sunken: '#E6F6FB',
  elevated: '#FFFFFF',
  hairline: '#CDE8F0',
  hairlineStrong: '#AED8E4',
  fg: '#08191F',
  muted: '#3F5A66',
  faint: '#516E78',
  /** Cyan as a surface. Carries dark ink, never white — white is 2.19:1. */
  accent: '#0BC0DC',
  /** The ink that sits on `accent`. 8.20:1. */
  onAccent: '#08191F',
  /** Cyan darkened enough to be text. 5.33:1 on sunken, the worst case. */
  accentText: '#086E80',
  link: '#086E80',
  live: '#0A7550',
  danger: '#C8353F',
  /** Decorative only — a marker or an orb tint. 2.09:1 as text: never a word. */
  amber: '#F59E0B',
} as const
