import Link from 'next/link'
import { trackAttrs } from '@/lib/analytics/events'
import { linkableChannels, site } from '@/content/site'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline bg-canvas/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name} · {site.location}
        </p>
        <nav aria-label="Elsewhere" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/play"
            className="ease-console tracking-[0.1em] uppercase transition-colors duration-200 hover:text-accent-text"
          >
            Games
          </Link>
          {/* linkableChannels, not visibleChannels: a footer is a row of links,
              and a handle with no profile URL has nothing to link to. Discord
              still appears in the contact panel, where it can be shown as text. */}
          {linkableChannels.map((channel) => (
            <a
              key={channel.id}
              href={channel.url}
              target="_blank"
              rel="noreferrer noopener me"
              {...trackAttrs('channel_clicked', { channel: channel.id, source: 'footer' })}
              className="ease-console tracking-[0.1em] uppercase transition-colors duration-200 hover:text-accent-text"
            >
              {channel.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
