import { ActionLink } from '@/components/action-link'
import { site } from '@/content/site'

const RESUME_UPDATED = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${site.resume.updatedAt}T00:00:00Z`))

/**
 * Server-rendered on purpose — the h1 is the LCP element, so nothing here
 * fades in and no client JS gates first paint.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-28 md:pb-20">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex size-1.5" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-70" />
            <span className="absolute inset-0 rounded-full bg-live" />
          </span>
          {site.location}
        </span>
        <span className="text-faint" aria-hidden="true">
          /
        </span>
        <span>Currently at {site.currentCompany}</span>
      </p>

      <h1 className="mt-8 font-mono text-[clamp(2.125rem,7.5vw,4.5rem)] leading-[0.94] font-semibold tracking-[-0.045em] text-balance text-fg">
        Ajay Singh
        <br />
        Parmar
      </h1>

      <p className="mt-6 font-mono text-sm tracking-tight md:text-base">
        <span className="font-medium text-accent-text">{site.positioning.role}</span>
        <span className="mx-2 text-faint" aria-hidden="true">
          ·
        </span>
        <span className="text-fg">{site.positioning.qualifier}</span>
      </p>

      <div className="mt-8 max-w-2xl space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
        {site.tagline.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {site.heroActions.map((action) => (
          <ActionLink key={action.id} action={action} />
        ))}
      </div>

      <p className="mt-5 font-mono text-[11px] tracking-[0.12em] text-faint uppercase">
        {site.resume.filename} · updated {RESUME_UPDATED}
      </p>
    </section>
  )
}
