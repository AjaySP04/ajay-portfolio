import Link from 'next/link'
import { ArrowUpRight, BookText, ExternalLink, FileCode, GitBranch } from 'lucide-react'
import { trackAttrs } from '@/lib/analytics/events'
import type { Project } from '@/content/projects/schema'
import type { ProjectStatus } from '@/content/projects/taxonomy'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/content/projects/taxonomy'

const STATUS_DOT: Record<ProjectStatus, string> = {
  live: 'bg-live',
  building: 'bg-accent',
  archived: 'bg-hairline-strong',
}

const LINK_META = {
  demo: { label: 'Live demo', Icon: ExternalLink },
  repo: { label: 'Source', Icon: GitBranch },
  docs: { label: 'Companion repo', Icon: FileCode },
  writeup: { label: 'Write-up', Icon: BookText },
} as const

/**
 * `headingLevel` exists because the same card sits at two different depths:
 * inside a Panel on the homepage (which supplies the h2) and directly under the
 * page h1 on /projects. Hardcoding h3 skips a level in the second case.
 */
export function ProjectCard({
  project,
  headingLevel: Heading = 'h3',
}: {
  project: Project
  headingLevel?: 'h2' | 'h3'
}) {
  const links = Object.entries(LINK_META).filter(
    ([key]) => project.links[key as keyof typeof LINK_META],
  )

  // bg-canvas, not elevated: these nest inside an elevated panel on the
  // homepage, and stacking two translucent elevated layers muddies both.
  return (
    <article className="flex flex-col rounded-sm border border-hairline bg-canvas">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-2.5 text-[11px] tracking-[0.06em] uppercase">
        <span className="inline-flex items-center gap-2 text-fg">
          <span className={`size-1.5 rounded-full ${STATUS_DOT[project.status]}`} aria-hidden="true" />
          {STATUS_LABELS[project.status]}
        </span>
        <span className="text-faint" aria-hidden="true">
          /
        </span>
        <span className="text-accent-text">{CATEGORY_LABELS[project.category]}</span>
        <span className="ml-auto text-faint normal-case">{project.period}</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <Heading className="text-[17px] font-medium tracking-tight text-fg">
            {project.deepDive ? (
              <Link
                href={`/projects/${project.slug}`}
                className="ease-console transition-colors duration-200 hover:text-accent-text"
              >
                {project.title}
              </Link>
            ) : (
              project.title
            )}
          </Heading>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{project.tagline}</p>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <li
              key={item}
              className="rounded-sm border border-hairline px-2 py-0.5 text-[11px] text-muted"
            >
              {item}
            </li>
          ))}
        </ul>

        {project.metrics ? (
          <dl className="mt-auto grid gap-px overflow-hidden rounded-sm bg-hairline sm:grid-cols-3">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="bg-canvas px-3 py-2.5">
                <dt className="text-[10px] tracking-[0.16em] text-faint uppercase">
                  {metric.label}
                </dt>
                <dd className="mt-1 text-[12px] text-fg">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline px-4 py-3">
        {links.map(([key, { label, Icon }]) => (
          <a
            key={key}
            href={project.links[key as keyof typeof LINK_META]}
            target="_blank"
            rel="noreferrer noopener"
            {...trackAttrs('project_clicked', { slug: project.slug, target: key })}
            className="ease-console inline-flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-muted uppercase transition-colors duration-200 hover:text-accent-text"
          >
            <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </a>
        ))}

        {project.deepDive ? (
          <Link
            href={`/projects/${project.slug}`}
            {...trackAttrs('project_clicked', { slug: project.slug, target: 'detail' })}
            className="ease-console ml-auto inline-flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
          >
            {/* Names the target rather than saying "read more" — generic link
                text is both a screen-reader problem and an SEO audit failure. */}
            More on {project.title}
            <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ) : null}
      </footer>
    </article>
  )
}
