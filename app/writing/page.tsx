import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PostList } from '@/components/post-list'
import { getPosts, writing } from '@/content/writing'

export const metadata: Metadata = {
  title: 'Engineering Notes',
  description:
    'Technical writing by Ajay Singh Parmar on Go concurrency, Redis persistence, and the backend failure modes that are easy to get subtly wrong.',
  alternates: { canonical: '/writing' },
  openGraph: {
    type: 'website',
    url: '/writing',
    title: 'Engineering Notes',
    description: 'Engineering notes on Go concurrency, Redis durability, and backend systems.',
  },
}

export default async function WritingPage() {
  const posts = await getPosts()

  return (
    <>
      <PageHeader
        kicker={writing.heading}
        title="The decisions that do not fit in a tutorial"
        intro={writing.intro}
      />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-sm border border-hairline bg-elevated/60">
          {posts.length > 0 ? (
            <PostList posts={posts} source="writing" headingLevel="h2" />
          ) : (
            /* Only reachable if the feed is down on a cold build. Says something
               useful and links out, rather than rendering an empty frame. */
            <p className="px-5 py-8 text-[15px] leading-relaxed text-muted">
              {writing.emptyMessage}
            </p>
          )}

          <div className="border-t border-hairline px-5 py-4">
            <a
              href={writing.profileUrl}
              target="_blank"
              rel="noreferrer noopener me"
              className="ease-console inline-flex items-center gap-2 text-[11px] tracking-[0.06em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
            >
              Follow on Medium
              <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
