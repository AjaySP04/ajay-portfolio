import { Inter, JetBrains_Mono } from 'next/font/google'

// next/font downloads and self-hosts these at build time — no request ever
// leaves for fonts.gstatic.com, and the CSS is inlined so there is no
// layout shift to pay for.

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})
