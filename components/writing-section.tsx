import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Panel } from '@/components/panel'
import { PostList } from '@/components/post-list'
import { Section } from '@/components/section'
import { HOMEPAGE_POST_COUNT, getPosts, writing } from '@/content/writing'

/**
 * Homepage writing section.
 *
 * Async server component: the feed is fetched during static generation and
 * revalidated on Next's schedule, so this costs the visitor nothing.
 *
 * Renders nothing at all when there are no posts. An empty panel saying "no
 * posts yet" is worse than the section not existing — it draws attention to the
 * gap rather than to the work.
 */
export async function WritingSection() {
  const posts = await getPosts()
  if (posts.length === 0) return null

  const shown = posts.slice(0, HOMEPAGE_POST_COUNT)

  return (
    <Section id="writing" className="mt-24">
      <Panel
        title={writing.heading}
        headingId="writing-heading"
        meta={posts.length > shown.length ? `${shown.length} of ${posts.length} shown` : 'On Medium'}
      >
        <p className="border-b border-hairline px-5 py-4 text-[15px] leading-relaxed text-muted md:text-base">
          {writing.intro}
        </p>

        <PostList posts={shown} source="home" />

        <div className="border-t border-hairline px-4 py-3">
          <Link
            href="/writing"
            className="ease-console inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
          >
            All writing
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </Panel>
    </Section>
  )
}
