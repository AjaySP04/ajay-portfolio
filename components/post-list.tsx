import { ArrowUpRight } from 'lucide-react'
import { trackAttrs } from '@/lib/analytics/events'
import type { Post } from '@/content/writing'

/** Tags per post. Medium attaches five; two carries the signal without wrapping. */
const MAX_TAGS = 2

/**
 * The list of posts, shared by the homepage section and /writing.
 *
 * A list rather than a card grid, on purpose. There are two posts: a grid would
 * leave an obvious hole and make a small body of writing look like an unfinished
 * section, where a dense list of two rows reads as complete.
 */
export function PostList({
  posts,
  source,
  headingLevel = 'h3',
}: {
  posts: Post[]
  /** Distinguishes homepage clicks from /writing clicks in analytics. */
  source: string
  /** The homepage sits under an h2 panel title; /writing sits under the h1. */
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel

  return (
    <ul className="grid gap-px bg-hairline">
      {posts.map((post) => (
        <li key={post.url} className="bg-canvas">
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer noopener"
            {...trackAttrs('post_clicked', { url: post.url, source })}
            className="ease-console group flex flex-col gap-2 px-5 py-4 transition-colors duration-200 hover:bg-sunken/60"
          >
            <div className="flex items-start justify-between gap-4">
              <Heading className="text-[15px] leading-snug font-medium text-fg group-hover:text-accent-text">
                {post.title}
              </Heading>
              <ArrowUpRight
                className="mt-0.5 size-3.5 shrink-0 text-faint group-hover:text-accent-text"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-faint">
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              ) : null}
              {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
              {post.tags.slice(0, MAX_TAGS).map((tag) => (
                <span key={tag} className="text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Fixed UTC locale and time zone.
 *
 * The server renders this into static HTML; letting it read the machine's locale
 * would make the build output depend on where it ran, and a date near a month
 * boundary could render one day off from the reader's own zone.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
