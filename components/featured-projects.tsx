import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CollapsibleSection } from '@/components/collapsible-section'
import { ProjectCard } from '@/components/project-card'
import { Section } from '@/components/section'
import { featuredProjects, projects } from '@/content/projects'

export function FeaturedProjects() {
  if (featuredProjects.length === 0) return null

  return (
    <Section id="work" className="mt-24">
      <CollapsibleSection
        title="Selected work"
        headingId="work-heading"
        meta={`${featuredProjects.length} of ${projects.length} shown`}
      >
        {/* Cards carry their own frame, so they sit directly on the panel body
            rather than inside a second hairline grid. */}
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>

        <div className="border-t border-hairline px-4 py-3">
          <Link
            href="/projects"
            className="ease-console inline-flex items-center gap-2 text-[11px] tracking-[0.06em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
          >
            All projects
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </CollapsibleSection>
    </Section>
  )
}
