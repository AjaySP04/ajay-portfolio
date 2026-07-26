'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // next-themes leaves resolvedTheme undefined until it has mounted and read
  // storage. Dark is the default, so the icon can commit to dark immediately;
  // the label stays generic until the theme is actually known so it never lies.
  const isDark = resolvedTheme !== 'light'
  const label =
    resolvedTheme === undefined
      ? 'Switch theme'
      : isDark
        ? 'Switch to light theme'
        : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
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
