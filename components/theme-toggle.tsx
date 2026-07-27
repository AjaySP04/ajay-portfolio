'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { track } from '@/lib/analytics/client'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  // `theme` first: with enableSystem={false} next-themes never populates
  // resolvedTheme, so relying on it alone left the label stuck at the generic
  // "Switch theme" forever instead of naming the action.
  const active = theme ?? resolvedTheme
  const isDark = active !== 'light'
  const label =
    active === undefined
      ? 'Switch theme'
      : isDark
        ? 'Switch to light theme'
        : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? 'light' : 'dark'
        setTheme(next)
        track('theme_toggled', { to: next })
      }}
      aria-label={label}
      title={label}
      className="ease-console inline-flex size-9 items-center justify-center rounded-sm border border-transparent text-muted transition-colors duration-200 hover:border-hairline hover:bg-elevated hover:text-fg"
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="size-4" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  )
}
