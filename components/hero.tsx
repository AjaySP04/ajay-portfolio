import { ActionLink } from '@/components/action-link'
import { HeroField } from '@/components/hero-field'
import { trackAttrs } from '@/lib/analytics/events'
import { site } from '@/content/site'

const RESUME_UPDATED = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${site.resume.updatedAt}T00:00:00Z`))

/**
 * Server-rendered on purpose — the h1 is the LCP element, so nothing here fades
 * in and no client JS gates first paint. `HeroField` is a client component, but
 * it is only a canvas: it paints after the headline, never before it.
 *
 * The wash is a pale gradient panel rather than a saturated block. A solid
 * colour dominated the page and dragged the design toward "corporate hero
 * banner"; a wash bookends the top without competing with the content below it,
 * and lets the orb field read straight through.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-10 pb-14 md:pt-14 md:pb-20">
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--hero-edge)] bg-[image:var(--hero-bg)] px-6 py-12 md:px-10 md:py-16">
        <HeroField />

        <div className="relative">
          {/* Stacked rather than one row separated by a slash: these are two
              statements, not a location and an employer. The pulse stays on the
              first line, where "building" is the present-tense claim it marks. */}
          <div className="space-y-1.5 text-[11px] font-bold tracking-[0.07em] uppercase">
            {site.hero.eyebrow.map((line, index) => (
              <p key={line} className={index === 0 ? 'text-muted' : 'text-faint'}>
                {index === 0 ? (
                  <span className="relative mr-2 inline-flex size-1.5" aria-hidden="true">
                    <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-70" />
                    <span className="absolute inset-0 rounded-full bg-live" />
                  </span>
                ) : null}
                {line}
              </p>
            ))}
          </div>

          <h1 className="mt-8 text-[clamp(2.125rem,7.5vw,4.5rem)] leading-[0.94] font-bold tracking-[-0.04em] text-balance text-fg">
            Ajay Singh
            <br />
            Parmar
          </h1>

          {/* Wraps on narrow screens rather than shrinking: the qualifier is
              four terms, and squeezing them onto one line at 320px would cost
              more legibility than a second line costs rhythm. */}
          <p className="mt-6 flex flex-wrap items-baseline gap-x-2 text-sm tracking-tight md:text-base">
            <span className="font-semibold text-accent-text">{site.positioning.role}</span>
            <span className="text-faint" aria-hidden="true">
              ·
            </span>
            <span className="text-fg">{site.positioning.qualifier}</span>
          </p>

          <div className="mt-8 max-w-2xl space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
            {site.hero.intro.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {site.heroActions.map((action) => (
              <ActionLink key={action.id} action={action} />
            ))}
          </div>

          {/* The button above opens the PDF in a tab, so this line is the only
              route left to the forced-download route. Pointing it at viewPath
              would leave /resume unreachable from the homepage entirely. */}
          <p className="mt-5 text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
            <a
              href={site.resume.downloadPath}
              download={site.resume.filename}
              {...trackAttrs('resume_downloaded', {
                source: 'hero-filename',
                variant: 'attachment',
              })}
              className="ease-console underline decoration-hairline-strong decoration-1 underline-offset-4 transition-colors duration-200 hover:text-fg hover:decoration-accent"
            >
              {site.resume.filename}
            </a>{' '}
            · updated {RESUME_UPDATED}
          </p>
        </div>
      </div>
    </section>
  )
}
