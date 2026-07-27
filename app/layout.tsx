import type { Metadata, Viewport } from 'next'
import { inter, jetbrainsMono } from '@/app/fonts'
import { NodeGraphBackground } from '@/components/node-graph-background'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { site } from '@/content/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.positioning.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.tagline.join(' '),
  applicationName: site.name,
  authors: [{ name: site.name }],
}

export const viewport: Viewport = {
  // Dark is the default and is not derived from the OS, so this is a single
  // value rather than a prefers-color-scheme pair.
  themeColor: '#08090B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only rounded-sm border border-accent bg-canvas px-4 py-2 font-mono text-[12px] tracking-[0.12em] uppercase focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
          >
            Skip to content
          </a>
          <NodeGraphBackground />
          <div className="relative flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
