import { deepDiveProjects, getProject } from '@/content/projects'
import { CATEGORY_LABELS } from '@/content/projects/taxonomy'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return deepDiveProjects.map((project) => ({ slug: project.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)

  return renderOgImage({
    kicker: project ? CATEGORY_LABELS[project.category] : 'Project',
    title: project?.title ?? 'Project',
    subtitle: project?.tagline,
    footer: project ? `${project.stack.slice(0, 4).join(' · ')}` : undefined,
  })
}
