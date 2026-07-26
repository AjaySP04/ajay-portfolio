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
cp .env.example .env.local   # only needed for the contact form
pnpm dev                     # http://localhost:3000
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
  projects/page.tsx       full grid with category + stack filters
  projects/[slug]/        detail page, generated only for deepDive projects
  resume/route.ts         streams the PDF as a download
  resume/view/route.ts    serves the same PDF inline
components/               presentation only — no content lives here
content/
  site.ts                 name, nav, channels, hero buttons, metrics
  about.ts  experience.ts  skills.ts
  projects/
    schema.ts             the Project contract
    index.ts              display order + derived filter lists
    <slug>.ts             one file per project
lib/                      resume streaming helper
public/
  resume/ajay_singh_parmar_resume.pdf
  images/profile.jpg      1400px master, kept for the OG image
  images/profile-400.jpg  what the About section actually serves
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

**Projects.** `content/projects/`. Adding one is a new `<slug>.ts` plus one line in
`index.ts`; reordering the site is moving that line, because the array order in `index.ts`
*is* the display order. The build fails on a duplicate slug or a project with no links at all.

Per-project flags worth knowing:

| Field | Effect |
| --- | --- |
| `featured: true` | Also appears in "Selected work" on the homepage |
| `deepDive: true` | Generates `/projects/<slug>`. Without it that URL is a 404 — deliberate, so a thin project never gets a page emptier than the card it was clicked from |
| `status` | `live` / `building` / `archived`, drives the coloured dot |
| `stack` | Filter chips on `/projects` are derived from the union of these. There is no filter list to maintain |

A demo link is only ever present when the demo actually resolves. Tarjuman's is omitted for
exactly this reason — `live-speech-transcriber.vercel.app` returns 404, and the omission is
noted in its content file so nobody adds it back on faith. Re-check before adding any demo URL.

---

## Contact form

`content/contact.ts` → `POST /api/contact` → Resend → inbox. Three layers of protection, all
server-side, all verified:

| Layer | Behaviour |
| --- | --- |
| Honeypot | A `company_website` field positioned offscreen and `aria-hidden`. Filled ⇒ answered as success and **nothing is sent**, so a bot learns nothing. Not `type="hidden"`, which bots skip |
| IP rate limit | 5 messages per 10 minutes, `Retry-After` on the 429 |
| Zod | Authoritative validation in the route handler; the browser only gets native HTML validation |

The email address is never in the HTML. It lives in `content/site.ts`, is read only inside the
route handler, and is verified absent from the prerendered HTML, the RSC payload and every
client chunk.

**The phone number is not published.** There is no `tel:` link and the digits are never
rendered. WhatsApp still works: the button points at the internal `/whatsapp` route, which 302s
to `wa.me` server-side, so the number exists only in a `Location` header. A direct `wa.me` href
would have leaked it into the HTML. Verified absent from the prerendered HTML, the RSC payload
and every client chunk.

Calendar booking is wired as a link — never an embed, since a booking widget would ship more
third-party JS than the rest of the site combined — and sits at `visible: false` until the
account exists.

Without `RESEND_API_KEY` the endpoint returns 503 `unconfigured` and logs the message
server-side. It never fakes success, because that would silently lose real mail.

The form has a real `action` and `method`, so it submits with JavaScript disabled — the handler
answers a native post with a 303 to `/contact/sent`. That page is `noindex`, which is why
Lighthouse reports SEO 60 for it; a form confirmation page should not be in search results.

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
