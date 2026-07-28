import { site } from '@/content/site'

/**
 * Medium posts, fetched from the RSS feed rather than hardcoded.
 *
 * Hardcoding the list would mean a deploy for every new post, which is exactly
 * the kind of chore that ends with a stale portfolio. Next's fetch cache with a
 * revalidate window gives new posts a route to the site on their own, and the
 * pages stay statically generated between refreshes.
 *
 * There are only two posts today, so the section is designed to look deliberate
 * at that size — a two-item list with real metadata, not a grid with holes in it.
 */

export const MEDIUM_PROFILE = 'https://medium.com/@ajaysparmar'
export const MEDIUM_FEED = 'https://medium.com/feed/@ajaysparmar'

/** Six hours. Medium is not a source of breaking news. */
const REVALIDATE_SECONDS = 6 * 60 * 60

export type Post = {
  title: string
  url: string
  /** ISO date, or null when the feed omits or malforms pubDate. */
  publishedAt: string | null
  /** Medium tags, capped at render time rather than here. */
  tags: string[]
  /** Reading time in minutes, when derivable from the content. */
  readingMinutes: number | null
}

/**
 * Last known good result.
 *
 * A Medium outage must not fail the build or blank the section. This survives
 * for the lifetime of the server process, which is enough to cover a transient
 * failure during revalidation; a cold start with the feed down falls back to an
 * empty list and the section renders its "read on Medium" state instead.
 */
let lastGood: Post[] | null = null

export async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(MEDIUM_FEED, {
      headers: {
        // Medium serves a bot-check page to a bare fetch with no User-Agent.
        'User-Agent': `${site.name} portfolio (+${site.url})`,
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (!response.ok) throw new Error(`feed responded ${response.status}`)

    const posts = parseFeed(await response.text())
    if (posts.length > 0) lastGood = posts
    return posts.length > 0 ? posts : (lastGood ?? [])
  } catch (cause) {
    console.warn('[writing] Medium feed unavailable, using last known good list:', cause)
    return lastGood ?? []
  }
}

/**
 * Minimal RSS reader.
 *
 * Deliberately regex over an XML parser: the shape of Medium's feed is fixed and
 * known, this runs at build time on one document, and a parser dependency would
 * be a larger surface than the thing it parses.
 */
function parseFeed(xml: string): Post[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  return items
    .map((item): Post | null => {
      const title = decodeEntities(stripCdata(tag(item, 'title') ?? '')).trim()
      const rawLink = stripCdata(tag(item, 'link') ?? '').trim()
      if (!title || !rawLink) return null

      return {
        title,
        // Medium appends ?source=rss-... to every link; it survives sharing and
        // shows up in analytics as referral noise.
        url: rawLink.split('?')[0] ?? rawLink,
        publishedAt: parseDate(tag(item, 'pubDate')),
        tags: (item.match(/<category>[\s\S]*?<\/category>/g) ?? [])
          .map((raw) => decodeEntities(stripCdata(raw.replace(/<\/?category>/g, ''))).trim())
          .filter(Boolean),
        readingMinutes: estimateReadingMinutes(item),
      }
    })
    .filter((post): post is Post => post !== null)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

function tag(source: string, name: string): string | null {
  const match = source.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return match?.[1] ?? null
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Ampersand last, or an already-decoded entity gets mangled.
    .replace(/&amp;/g, '&')
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null
  const parsed = new Date(stripCdata(raw).trim())
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/**
 * Reading time from the encoded content, at 220 words per minute.
 *
 * Medium publishes its own estimate but not in the feed, so this is our own
 * approximation of it and rounds up — never reported as zero minutes.
 */
function estimateReadingMinutes(item: string): number | null {
  const encoded = tag(item, 'content:encoded')
  if (!encoded) return null
  const words = stripCdata(encoded)
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  if (words === 0) return null
  return Math.max(1, Math.round(words / 220))
}

/** Homepage shows a slice; /writing shows everything. */
export const HOMEPAGE_POST_COUNT = 3

export const writing = {
  // Renamed from "Writing" 2026-07-28. The ROUTE stays /writing: it is indexed,
  // in the sitemap and in llms.txt, and renaming it would discard that for a
  // cosmetic gain. Only the label changed.
  heading: 'Engineering Notes',
  intro:
    'Thoughts from building distributed systems, production AI software and backend platforms—covering the engineering decisions, tradeoffs and failure modes that rarely make it into tutorials.',
  profileUrl: MEDIUM_PROFILE,
  emptyMessage: 'Posts are on Medium.',
} as const
