import { Panel } from '@/components/panel'
import { Section } from '@/components/section'
import { skills } from '@/content/skills'

export function SkillsSection() {
  return (
    <Section id="skills" className="mt-24">
      <Panel
        title="Skills"
        headingId="skills-heading"
        meta={`${skills.groups.length} groups · no self-rated scores`}
      >
        <dl>
          {skills.groups.map((group) => (
            <div
              key={group.id}
              className="grid gap-x-6 gap-y-3 border-t border-hairline px-5 py-4 first:border-t-0 md:grid-cols-[176px_1fr] md:items-baseline"
            >
              <dt className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
                {group.label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-sm border border-hairline bg-elevated/60 px-2 py-1 font-mono text-[12px] text-fg"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-hairline px-5 py-4">
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            Also shipped, off the résumé skills line
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
            {skills.alsoShipped.map((item) => (
              <li key={item.name} className="font-mono text-[12px] text-muted">
                <span className="text-fg">{item.name}</span>{' '}
                <span className="text-faint">— {item.where}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </Section>
  )
}
