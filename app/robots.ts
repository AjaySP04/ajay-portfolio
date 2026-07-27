import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { AI_CRAWLERS } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  // Nothing here is secret; the only paths worth withholding are the ones that
  // are not pages at all, plus the noindex confirmation page.
  const disallow = ['/api/', '/contact/sent', '/whatsapp']

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Named explicitly: several answer-engine crawlers read only their own
      // group and ignore the wildcard rule entirely.
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
