'use client'

import type { ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Light is the default and is not derived from the OS. Dark is a full,
 * first-class alternative reachable from the toggle — not a degraded mode.
 *
 * Reduced motion is handled without a JS provider: globals.css neutralises all
 * CSS animation and transition, gates the scroll-reveal behind
 * `prefers-reduced-motion: no-preference`, and the canvas background reads the
 * same media query to fall back to a static frame. When Phase 2 introduces the
 * first Motion component, wrap this tree in
 * `<MotionConfig reducedMotion="user">` so Motion honours it too.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
