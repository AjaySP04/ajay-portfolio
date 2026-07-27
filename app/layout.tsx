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

// Names the city: "senior developer dubai" is a query a recruiter actually
// types, and the name alone already has little competition.
const TITLE = `${site.name} — ${site.positioning.role}, ${site.location.split(',')[0]}`

/**
 * Only emitted when a token is actually set. An empty
 * <meta name="google-site-verification" content=""> is not a no-op: it can make
 * Search Console report the property as incorrectly verified.
 */
const verification =
  site.verification.google || site.verification.bing
    ? {
        ...(site.verification.google ? { google: site.verification.google } : {}),
        ...(site.verification.bing ? { other: { 'msvalidate.01': site.verification.bing } } : {}),
      }
    : undefined

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
  ...(verification ? { verification } : {}),
}

export const viewport: Viewport = {
  // A single value, matching the light --p-canvas: the theme is class-based, not
  // derived from the OS, so keying this on prefers-color-scheme would be a lie.
  themeColor: '#FDFCF9',
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
        {/* The script lives at /_vercel/speed-insights/script.js, which only the
            platform serves — anywhere else (local `pnpm start`, the Docker image)
            it 404s and logs two console errors, costing 4 points of Lighthouse
            best-practices for no benefit. So it is opt-OUT, not opt-in.

            This was gated on `process.env.VERCEL` and silently collected nothing
            in production for the whole first month: that variable only exists if
            "Automatically expose System Environment Variables" is on, and it was
            not. An affirmative gate on a variable the platform may not provide
            fails closed, which is exactly wrong for telemetry — you cannot tell
            "no traffic" from "not wired up". Failing open means the only place it
            can be off is somewhere we said so explicitly, below. */}
        {process.env.DISABLE_SPEED_INSIGHTS ? null : <SpeedInsights />}
      </body>
    </html>
  )
}
