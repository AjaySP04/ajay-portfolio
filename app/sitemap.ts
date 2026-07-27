import type { MetadataRoute } from 'next'
import { deepDiveProjects } from '@/content/projects'
import { games } from '@/content/games'
import { absoluteUrl } from '@/lib/seo'

/**
 * Generated from content, so a new project or game appears here automatically.
 *
 * Deliberately excluded: /contact/sent (noindex), /resume and /resume/view
 * (they stream a PDF, not a page), /whatsapp (a redirect) and /api/*.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/projects'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/play'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const projectRoutes: MetadataRoute.Sitemap = deepDiveProjects.map((project) => ({
    url: absoluteUrl(`/projects/${project.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: absoluteUrl(game.href),
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.3,
  }))

  return [...staticRoutes, ...projectRoutes, ...gameRoutes]
}
