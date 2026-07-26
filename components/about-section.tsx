import { Panel } from '@/components/panel'
import { Section } from '@/components/section'
import { about } from '@/content/about'
import { site } from '@/content/site'

const LABEL = 'font-mono text-[10px] tracking-[0.18em] text-faint uppercase'

export function AboutSection() {
  const { summary, portrait, domains, education, interests, facts } = about

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
            <div className="space-y-4 p-5 text-[15px] leading-relaxed text-muted md:text-base">
              {summary.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

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
