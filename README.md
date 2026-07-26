# ajay-portfolio

Personal site for Ajay Singh Parmar — senior developer, backend-heavy full-stack, Dubai.

Built so that keeping it current is a content edit, not a code change: the résumé is one
file at a fixed path, and every section reads from typed, build-validated content modules.

Target domain: `ajaysparmar.tech` (Vercel).

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.2 (App Router, RSC) | Server-render the whole page; API routes cover the résumé and contact endpoints without a third party |
| Runtime | React 19, TypeScript 5.9 `strict` | `noUncheckedIndexedAccess` and `verbatimModuleSyntax` on |
| Styling | Tailwind CSS v4, CSS-first `@theme` | No JS config; theme tokens are plain custom properties |
| Fonts | `next/font` — JetBrains Mono + Inter | Self-hosted at build time, no request to a font CDN |
| Icons | `lucide-react` | |
| Theme | `next-themes`, dark default | Light mode is a full mirror, not an afterthought |
| Validation | Zod | Content is parsed at build, so a malformed entry fails CI |
| Deploy | Vercel | |

Accessibility primitives will be Radix UI directly, used sparingly — deliberately not
shadcn/ui, whose visual signature is recognisable enough to undercut the point of a
hand-built portfolio.

---

## Running it

Requires Node 20.9+ and pnpm 11.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build        # production build
pnpm start        # serve the build
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
```

### Docker

For a local preview or self-hosting. Vercel builds from source and ignores this.

```bash
docker build -t ajay-portfolio .
docker run --rm -p 3000:3000 ajay-portfolio
```

---

## Layout

```
app/
  layout.tsx              root shell, metadata, fonts, theme provider
  page.tsx                homepage section order
  globals.css             theme tokens, reduced-motion rules, scroll reveal
  resume/route.ts         streams the PDF as a download
  resume/view/route.ts    serves the same PDF inline
components/               presentation only — no content lives here
content/                  every word on the site, Zod-validated
lib/                      resume streaming helper
public/
  resume/ajay_singh_parmar_resume.pdf
  images/profile.jpg
```

---

## Updating content

Nothing below requires touching a component.

**The résumé.** Overwrite `public/resume/ajay_singh_parmar_resume.pdf` and push. The
filename is fixed on purpose: `/resume` streams it with a `Content-Disposition` header, so a
download always lands as `ajay_singh_parmar_resume.pdf` whether it came from the button, a
pasted URL or a link someone forwarded. `/resume/view` serves the same bytes inline. Bump
`resume.updatedAt` in `content/site.ts` so the hero shows the right date.

**Name, positioning, contact channels, hero buttons, nav, metrics.** `content/site.ts`.
Channels have a `visible` flag — flip it to add or hide one. The metrics strip carries a
mandatory `disclaimer` and a per-metric `source`, because those figures are career-wide
peaks from a specific platform and era, not current-role numbers.

**Work history.** `content/experience.ts`. Array order is display order, newest first. An
`end` of `null` marks the current role and renders the live indicator.

**Skills.** `content/skills.ts`. Grouped, with no proficiency ratings or year counts by
design — they are unverifiable and a senior reader discounts them on sight. Where something
was actually used is in the experience entries.

**About, education, interests.** `content/about.ts`.

---

## Design notes

The look is dark-first and deliberately instrument-like: JetBrains Mono carries every
heading, label and number, Inter carries prose only, and that split does the identity work
so no decorative chrome is needed. 1px hairlines, an 8px grid, border radius capped at 4px.

A few decisions that are easy to undo by accident:

- **Never name a theme colour after a font-size step.** A colour token called `base` made
  `--color-base` shadow Tailwind's `--text-base`, and `md:text-base` silently compiled to
  `color: var(--p-base)` — text painted in the page background. The surface token is called
  `canvas` for this reason.
- **The scroll reveal animates transform only, never opacity.** It is a CSS scroll-driven
  animation, which is position-bound and reversible, so stopping mid-scroll parks an element
  wherever the range puts it. Fading would make partial opacity a resting state and fail
  contrast at rest.
- **Content is visible before JavaScript runs.** The reveal starts from the visible state and
  is gated behind `@supports (animation-timeline: view())`, so a blocked script or an older
  browser degrades to plain readable content rather than a blank panel.
- **Reduced motion is handled in three places** and all three must stay in sync: the global
  CSS block in `globals.css`, the `prefers-reduced-motion: no-preference` gate on the reveal,
  and the media query the canvas background reads to render a static frame.
- **The canvas background is a two-tier topology** — sparse wide-reach hubs plus local
  leaves — because a uniform scatter of nodes reads as noise at any density. Tune it with
  `AREA_PER_NODE` and the reach constants in `components/node-graph-background.tsx`, and the
  `--graph-*-alpha` tokens per theme in `globals.css`. It renders a single static frame below
  `md` and under reduced motion, and stops entirely when the tab is hidden.

---

## Performance

Measured against a production build, three runs each:

| | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 |
| Mobile | 97 | 100 | 100 | 100 | 2.6 s | 0 |

The canvas holds 120fps with no dropped frames up to a 3840×2160 buffer.

Two caveats worth knowing before setting CI thresholds:

- **Homepage JS is ~149 KB gzip (~128 KB brotli).** A Next 16.2 App Router page with zero
  client components already costs ~142 KB gzip, so almost all of that is framework floor —
  application code is single digits. A sub-120 KB target is not reachable on this stack.
- **Mobile LCP is transfer-bound, not code-bound.** Lighthouse's mobile profile simulates
  1.6 Mbps, and ~87 KB of that budget is the two self-hosted variable fonts. Desktop LCP is
  0.5 s; treat 1.2 s as a field-data target rather than a Lighthouse-mobile one.

Excluded from the JS figure: Next emits a `noModule` polyfill chunk (~38 KB gzip) that no
modern browser fetches.
