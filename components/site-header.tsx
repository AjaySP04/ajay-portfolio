import Link from 'next/link'
import { Mark } from '@/components/mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { trackAttrs } from '@/lib/analytics/events'
import { site } from '@/content/site'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="ease-console inline-flex shrink-0 items-center gap-2.5 font-mono text-[13px] tracking-tight text-fg transition-colors duration-200 hover:text-accent-text"
        >
          <Mark className="size-4 text-accent-text" />
          <span className="hidden sm:inline">{site.name.toLowerCase()}</span>
          <span className="sm:hidden">asp</span>
        </Link>

        {/* Hidden below lg: four labels plus the résumé link and toggle will not
            fit a tablet width without crowding. */}
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {site.nav.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="ease-console inline-flex h-9 items-center rounded-sm border border-transparent px-3 font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:border-hairline hover:bg-elevated hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={site.resume.downloadPath}
            {...trackAttrs('resume_downloaded', { source: 'header' })}
            className="ease-console inline-flex h-9 items-center rounded-sm border border-transparent px-3 font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:border-hairline hover:bg-elevated hover:text-fg"
          >
            résumé
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
