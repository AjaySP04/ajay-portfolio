import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookText, ExternalLink, FileCode, GitBranch } from 'lucide-react'
import { JsonLd } from '@/components/structured-data'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { site } from '@/content/site'
import { absoluteUrl } from '@/lib/seo'
import { deepDiveProjects, getProject } from '@/content/projects'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/content/projects/taxonomy'

/**
 * Only projects flagged `deepDive` get a page. A detail route for a thin project
 * is worse than no route: it sends a reader somewhere emptier than the card they
 * clicked from.
 */
export function generateStaticParams() {
  return deepDiveProjects.map((project) => ({ slug: project.slug }))
}

// Not `dynamicParams = false`: that does return 404 for unknown slugs, but it
// gets there by throwing an internal NoFallbackError, which shows up as a
// logged error in production observability. The notFound() below is equivalent
// for the visitor and silent in the logs.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'article',
      url: `/projects/${project.slug}`,
      title: project.title,
      description: project.tagline,
    },
  }
}

const LINK_META = {
  demo: { label: 'Live demo', Icon: ExternalLink },
  repo: { label: 'Source', Icon: GitBranch },
  docs: { label: 'Companion repo', Icon: FileCode },
  writeup: { label: 'Write-up', Icon: BookText },
} as const

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)

  if (!project || !project.deepDive) notFound()

  const links = Object.entries(LINK_META).filter(
    ([key]) => project.links[key as keyof typeof LINK_META],
  )

  return (
    <>
      {/* Per-project structured data: names the work, its stack and where the
          source lives, plus a breadcrumb so search shows the real hierarchy
          rather than a bare URL. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareSourceCode',
              name: project.title,
              headline: project.title,
              description: project.tagline,
              abstract: project.description.join(' '),
              url: absoluteUrl(`/projects/${project.slug}`),
              codeRepository: project.links.repo,
              programmingLanguage: project.stack,
              keywords: project.stack.join(', '),
              author: { '@type': 'Person', name: site.name, url: site.url },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Projects',
                  item: absoluteUrl('/projects'),
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: project.title,
                  item: absoluteUrl(`/projects/${project.slug}`),
                },
              ],
            },
          ],
        }}
      />

      <PageHeader
        kicker={`${CATEGORY_LABELS[project.category]} · ${STATUS_LABELS[project.status]}`}
        title={project.title}
        intro={project.tagline}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
          {links.map(([key, { label, Icon }]) => (
            <a
              key={key}
              href={project.links[key as keyof typeof LINK_META]}
              target="_blank"
              rel="noreferrer noopener"
              className="ease-console inline-flex h-10 items-center gap-2 rounded-sm border border-hairline bg-elevated/70 px-4 text-[12px] tracking-[0.06em] text-fg uppercase transition-colors duration-200 hover:border-hairline-strong hover:bg-raised"
            >
              <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-6 px-6 pb-8">
        <Panel title="What it does" headingId="detail-heading" meta={project.period}>
          <div className="space-y-4 px-5 py-5 text-[15px] leading-relaxed text-muted md:text-base">
            {project.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Panel>

        <Panel title="Build" headingId="detail-facts-heading" meta={project.role}>
            {project.metrics ? (
              <dl className="grid gap-px bg-hairline sm:grid-cols-3">
                {project.metrics.map((metric) => (
                  <div key={metric.label} className="bg-canvas px-4 py-4">
                    <dt className="text-[10px] tracking-[0.16em] text-faint uppercase">
                      {metric.label}
                    </dt>
                    <dd className="mt-1.5 text-[13px] text-fg">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="border-t border-hairline px-5 py-4">
              <p className="text-[10px] tracking-[0.07em] text-faint uppercase">
                Stack
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {project.stack.map((item) => (
                  <li
                    key={item}
                    className="rounded-sm border border-hairline px-2 py-1 text-[12px] text-fg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
        </Panel>

        <Link
          href="/projects"
          className="ease-console inline-flex items-center gap-2 text-[11px] tracking-[0.06em] text-muted uppercase transition-colors duration-200 hover:text-accent-text"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          All projects
        </Link>
      </div>
    </>
  )
}
