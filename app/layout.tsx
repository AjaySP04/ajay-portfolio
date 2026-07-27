import type { Metadata, Viewport } from 'next'
import { inter, jetbrainsMono } from '@/app/fonts'
import { NodeGraphBackground } from '@/components/node-graph-background'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { site } from '@/content/site'
import { SITE_DESCRIPTION, SITE_KEYWORDS } from '@/lib/seo'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { ConsentBar } from '@/components/analytics/consent-bar'
import { StructuredData } from '@/components/structured-data'
import './globals.css'

const TITLE = `${site.name} — ${site.positioning.role}`

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: TITLE,
    template: `%s — ${site.name}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  keywords: SITE_KEYWORDS,
  // Every page sets its own; this is the fallback for the homepage.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
    url: site.url,
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE_DESCRIPTION,
    creator: '@ajays_parmar',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google show full-size previews and untruncated snippets; the
      // defaults are conservative and clip both.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
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
        <StructuredData />
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
          <AnalyticsProvider />
          <ConsentBar />
        </ThemeProvider>
        {/* Only on Vercel. The script lives at /_vercel/speed-insights/script.js,
            which the platform serves — anywhere else (local `pnpm start`, the
            Docker image) it 404s and logs two console errors, which costs 4
            points of Lighthouse best-practices for no benefit. */}
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  )
}
