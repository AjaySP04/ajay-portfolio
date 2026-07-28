import { Panel } from '@/components/panel'
import { Section } from '@/components/section'
import { about } from '@/content/about'
import { site } from '@/content/site'

const LABEL = 'font-mono text-[10px] tracking-[0.18em] text-faint uppercase'

export function AboutSection() {
  const { summary, builds, outlook, quote, portrait, domains, education, interests, facts } = about

  return (
    <Section id="about" className="mt-24">
      <Panel title="About" headingId="about-heading" meta={site.location}>
        <div className="grid gap-px bg-hairline lg:grid-cols-[240px_1fr]">
          <div className="space-y-6 bg-canvas p-5">
            {/* Deliberately not next/image: a single static asset that never
                changes, already exported at exactly 2x its render size. The
                image component would add ~5KB of client JS and a runtime
                optimisation hop to save nothing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              loading="lazy"
              decoding="async"
              className="w-full max-w-[200px] rounded-sm border border-hairline lg:max-w-none"
            />

            <dl className="space-y-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className={LABEL}>{fact.label}</dt>
                  <dd className="mt-1 font-mono text-[12px] leading-relaxed text-fg">
                    {fact.value}
                  </dd>
                </div>
              ))}
              <div>
                <dt className={LABEL}>Domains</dt>
                <dd className="mt-1 font-mono text-[12px] leading-relaxed text-fg">
                  {domains.join(' · ')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Flex column so the education/interests grid absorbs any height the
              taller left column forces, instead of leaving dead space and a
              divider that stops halfway down the panel. */}
          <div className="flex flex-col bg-canvas">
            {/* Three labelled blocks rather than one run of paragraphs: who,
                what, how. A reviewer skims for "what does he build" and
                previously had to read five paragraphs to find it. */}
            <div className="space-y-6 p-5">
              <div className="space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
                <h3 className={LABEL}>Who I am</h3>
                {summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div>
                <h3 className={LABEL}>What I build</h3>
                <dl className="mt-3 space-y-3">
                  {builds.map((build) => (
                    <div key={build.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                      <dt className="shrink-0 font-mono text-[12px] tracking-[0.06em] text-fg sm:w-40">
                        {build.label}
                      </dt>
                      <dd className="text-[14px] leading-relaxed text-muted">{build.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
                <h3 className={LABEL}>How I think</h3>
                {outlook.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Set apart deliberately: it is a stated point of view, not more
                biography, so it should not read as another paragraph. */}
            <figure className="border-t border-hairline bg-sunken/60 px-5 py-4">
              <blockquote className="border-l-2 border-accent pl-4 font-mono text-[14px] leading-relaxed text-fg">
                {quote.text}
              </blockquote>
              {/* Not uppercased: the transform mangles the transliteration's
                  diacritics (TIRUKKUṚAḶ) and turns "c. 5th" into "C. 5TH". */}
              <figcaption className="mt-2 pl-4 font-mono text-[11px] tracking-[0.08em] text-faint">
                {quote.attribution} · {quote.era}
              </figcaption>
            </figure>

            <div className="grid flex-1 gap-px border-t border-hairline bg-hairline sm:grid-cols-2">
              <div className="bg-canvas p-5">
                <h3 className={LABEL}>Education</h3>
                <p className="mt-2 font-mono text-[13px] text-fg">{education.institution}</p>
                <p className="mt-1 text-[13px] text-muted">
                  {education.qualification} · GPA {education.gpa}
                </p>
                <p className="mt-1 font-mono text-[11px] text-faint">{education.period}</p>
                <ul className="mt-3 space-y-1.5">
                  {education.extras.map((extra) => (
                    <li key={extra} className="flex gap-2 text-[13px] text-muted">
                      <span
                        className="mt-[7px] size-1 shrink-0 rotate-45 bg-faint"
                        aria-hidden="true"
                      />
                      {extra}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-canvas p-5">
                <h3 className={LABEL}>Outside work</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {interests.map((interest) => (
                    <li
                      key={interest}
                      className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] text-muted"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  )
}
