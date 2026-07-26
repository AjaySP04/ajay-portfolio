/**
 * Pure constants, deliberately in their own module with NO zod import.
 *
 * Client components need these labels. `schema.ts` imports zod at module scope,
 * so importing any *value* from it pulls the entire validator into the browser
 * bundle — measured at 66KB gzip before this split. Types are safe to import
 * from `schema.ts` because `import type` is erased; values must come from here.
 */

export const CATEGORIES = ['ai', 'backend', 'frontend', 'tooling', 'game'] as const
export const STATUSES = ['live', 'building', 'archived'] as const

export type ProjectCategory = (typeof CATEGORIES)[number]
export type ProjectStatus = (typeof STATUSES)[number]

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ai: 'AI',
  backend: 'Backend',
  frontend: 'Frontend',
  tooling: 'Tooling',
  game: 'Game',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: 'Live',
  building: 'Building',
  archived: 'Archived',
}
