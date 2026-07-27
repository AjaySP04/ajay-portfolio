'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { track } from '@/lib/analytics/client'

/**
 * Nothing here renders differently on the server than on the client.
 *
 * That is the whole design. The server cannot know a visitor's stored theme, so
 * any theme-dependent markup — the icon, or an aria-label naming the current
 * mode — is guaranteed to mismatch on hydration. Picking the icon in JS produced
 * React #418 in production the moment light became the default (server computed
 * "dark", client resolved "light"). So both icons are always rendered and CSS
 * chooses, keying off the class next-themes puts on <html> before first paint,
 * and the label is phrased to be true in either state.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const label = 'Toggle light or dark theme'

  return (
    <button
      type="button"
      onClick={() => {
        // Safe to read here: click handlers only ever run on the client.
        const next = (theme ?? resolvedTheme) === 'dark' ? 'light' : 'dark'
        setTheme(next)
        track('theme_toggled', { to: next })
      }}
      aria-label={label}
      title={label}
      className="ease-console inline-flex size-9 items-center justify-center rounded-sm border border-transparent text-muted transition-colors duration-200 hover:border-hairline hover:bg-elevated hover:text-fg"
    >
      {/* Sun means "switch to light", so it shows only in dark mode. */}
      <Sun className="hidden size-4 dark:block" strokeWidth={1.75} aria-hidden="true" />
      <Moon className="size-4 dark:hidden" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
