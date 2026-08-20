import { CollapsibleSection } from '@/components/collapsible-section'
import { Section } from '@/components/section'
import { roles } from '@/content/experience'

export function ExperienceSection() {
  return (
    <Section id="experience" className="mt-24">
      <CollapsibleSection
        title="Experience"
        headingId="experience-heading"
        meta={`${roles.length} roles · 2016 → present`}
      >
        <ol>
          {roles.map((role) => {
            const current = role.end === null

            return (
              <li key={role.id} className="border-t border-hairline first:border-t-0">
                <article className="grid gap-x-6 px-5 py-6 md:grid-cols-[108px_1fr]">
                  <p className="mb-3 text-[11px] tracking-[0.05em] text-faint tabular-nums md:mb-0 md:pt-0.5">
                    {role.years}
                  </p>

                  <div>
                    <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-medium tracking-tight text-fg">
                      {current ? (
                        <span className="relative flex size-1.5" aria-hidden="true">
                          <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-70" />
                          <span className="absolute inset-0 rounded-full bg-live" />
                        </span>
                      ) : (
                        <span
                          className="size-1.5 rotate-45 bg-hairline-strong"
                          aria-hidden="true"
                        />
                      )}
                      {role.company}
                    </h3>

                    <p className="mt-1.5 text-[12px] text-accent-text">{role.title}</p>

                    <p className="mt-1 text-[11px] text-faint">
                      {role.start} — {role.end ?? 'Present'} · {role.location}
                    </p>

                    <ul className="mt-4 space-y-2.5">
                      {role.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2.5 text-[14px] leading-relaxed text-muted"
                        >
                          <span
                            className="mt-[9px] size-1 shrink-0 rotate-45 bg-faint"
                            aria-hidden="true"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </CollapsibleSection>
    </Section>
  )
}
