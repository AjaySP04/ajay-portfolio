import type { Project } from './schema'
import type { ProjectCategory } from './taxonomy'
import { CATEGORY_LABELS } from './taxonomy'

import tarjuman from './tarjuman'
import convenienceFeeCalculator from './convenience-fee-calculator'
import insightHub from './insight-hub'
import covidTracker from './covid-tracker'

/**
 * ARRAY ORDER IS DISPLAY ORDER — most relevant first.
 * Reordering the site is moving a line in this list.
 */
export const projects: Project[] = [
  tarjuman,
  convenienceFeeCalculator,
  insightHub,
  covidTracker,
]

// Fail the build on a duplicate slug rather than shipping two pages that fight
// over the same route.
const duplicateSlugs = projects
  .map((project) => project.slug)
  .filter((slug, index, all) => all.indexOf(slug) !== index)

if (duplicateSlugs.length > 0) {
  throw new Error(`Duplicate project slugs: ${duplicateSlugs.join(', ')}`)
}

export const featuredProjects = projects.filter((project) => project.featured)
export const deepDiveProjects = projects.filter((project) => project.deepDive)

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

/** Derived, never hand-maintained — a new stack entry shows up as a filter. */
export const stackFilters: string[] = [
  ...new Set(projects.flatMap((project) => project.stack)),
].sort((a, b) => a.localeCompare(b))

/** Only categories actually in use, in the order they first appear. */
export const categoryFilters: { value: ProjectCategory; label: string }[] = [
  ...new Set(projects.map((project) => project.category)),
].map((value) => ({ value, label: CATEGORY_LABELS[value] }))

export type { Project } from './schema'
export type { ProjectCategory, ProjectStatus } from './taxonomy'
export { CATEGORY_LABELS, STATUS_LABELS } from './taxonomy'
