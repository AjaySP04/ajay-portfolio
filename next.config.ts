import type { NextConfig } from 'next'

/**
 * Content Security Policy.
 *
 * `script-src` carries 'unsafe-inline' and that is a deliberate, documented
 * trade-off rather than an oversight. Every page here is statically generated,
 * and App Router bootstraps hydration with inline scripts (next-themes injects
 * one too, before paint, to avoid a flash of the wrong theme). The alternative —
 * per-request nonces — forces every route to render dynamically, which throws
 * away the static generation the whole performance budget rests on. So the CSP
 * is aimed at the vector that actually matters for a site with no user input
 * rendered back to it: pulling executable code in from somewhere else. Origins
 * are enumerated, everything else is refused.
 *
 * Third-party origins are added only when the corresponding feature is switched
 * on, so the policy stays as tight as the deployment actually needs.
 */
function contentSecurityPolicy(): string {
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim()
  const posthogEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim())
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())

  // PostHog serves its snippet from an assets subdomain and ingests on the
  // api host, so both have to be allowed — and only when a key exists.
  const posthogOrigins = posthogEnabled
    ? [posthogHost || 'https://us.i.posthog.com', 'https://us-assets.i.posthog.com']
    : []

  const turnstileOrigins = turnstileEnabled ? ['https://challenges.cloudflare.com'] : []

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...posthogOrigins, ...turnstileOrigins],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    // vitals.vercel-insights.com is where Speed Insights reports to. Turnstile's
    // api.js fetches from its own origin as well as framing it, and a missing
    // connect-src here would only surface as a silently broken widget on the day
    // the keys get set — which is the worst time to find out.
    'connect-src': [
      "'self'",
      'https://vitals.vercel-insights.com',
      ...posthogOrigins,
      ...turnstileOrigins,
    ],
    // Turnstile renders its challenge in an iframe; nothing else may frame.
    'frame-src': turnstileEnabled ? turnstileOrigins : ["'none'"],
    // PostHog session replay compiles a worker from a blob.
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    // The contact form posts to this origin and nowhere else, so a script that
    // did get injected still could not exfiltrate a submission.
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }

  return (
    Object.entries(directives)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ') + '; upgrade-insecure-requests'
  )
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // NB: `experimental.inlineCss` was measured and rejected. It does remove the
  // one render-blocking stylesheet request, but the larger HTML delays font
  // discovery enough to cost ~100ms of LCP on a throttled mobile connection.

  // The resume routes read the PDF off disk at request time. Next's file
  // tracer cannot see a runtime `path.join`, so the asset has to be declared
  // explicitly or the serverless bundle ships without it.
  outputFileTracingIncludes: {
    '/resume': ['./public/resume/**/*'],
    '/resume/view': ['./public/resume/**/*'],
    // OG image generation reads JetBrains Mono from the installed fontsource
    // package; the tracer cannot see through a runtime path.join.
    '/opengraph-image': ['./node_modules/@fontsource/jetbrains-mono/files/*.woff'],
    '/projects/opengraph-image': ['./node_modules/@fontsource/jetbrains-mono/files/*.woff'],
    '/projects/[slug]/opengraph-image': ['./node_modules/@fontsource/jetbrains-mono/files/*.woff'],
    '/play/opengraph-image': ['./node_modules/@fontsource/jetbrains-mono/files/*.woff'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // frame-ancestors in the CSP is the directive browsers actually honour;
          // this stays for the ones that only understand the legacy header.
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'accelerometer=()',
              'camera=()',
              'display-capture=()',
              'geolocation=()',
              'gyroscope=()',
              'magnetometer=()',
              'microphone=()',
              'payment=()',
              'usb=()',
            ].join(', '),
          },
          // Severs the window.opener relationship, so a page opened from here
          // cannot navigate this one.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // Never let a proxy or browser cache a form response. Deliberately not
        // applied site-wide: the static pages *should* be cached hard.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ]
  },
}

export default nextConfig
