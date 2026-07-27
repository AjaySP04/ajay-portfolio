import type { NextConfig } from 'next'

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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
