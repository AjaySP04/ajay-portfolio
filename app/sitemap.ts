import type { MetadataRoute } from 'next'
import { deepDiveProjects } from '@/content/projects'
import { games } from '@/content/games'
import { site } from '@/content/site'
import { getPosts } from '@/content/writing'
import { absoluteUrl } from '@/lib/seo'

/**
 * Generated from content, so a new project or game appears here automatically.
 *
 * Deliberately excluded: /contact/sent (noindex), /resume and /resume/view
 * (they stream a PDF, not a page), /whatsapp (a redirect) and /api/*.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /**
   * Derived from content, not from build time.
   *
   * A `lastmod` stamped with the build date claims every page changed on every
   * deploy. Crawlers learn to distrust that, and it wastes crawl budget. This
   * only moves when the résumé date in content/site.ts moves.
   */
  const now = new Date(`${site.resume.updatedAt}T00:00:00Z`)

  /**
   * /writing carries the newest post's date rather than the résumé date, since
   * it is the one page here whose content changes without a deploy. Falls back
   * to `now` if the feed is unreachable while the sitemap is generated.
   */
  const posts = await getPosts()
  const newestPost = posts[0]?.publishedAt
  const writingModified = newestPost ? new Date(newestPost) : now

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/projects'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: absoluteUrl('/writing'),
      lastModified: writingModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
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
