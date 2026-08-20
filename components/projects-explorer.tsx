'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { ProjectCard } from '@/components/project-card'
import type { Project } from '@/content/projects/schema'
import type { ProjectCategory } from '@/content/projects/taxonomy'

type CategoryFilter = { value: ProjectCategory; label: string }

const CHIP =
  'ease-console rounded-sm border px-2.5 py-1 text-[11px] tracking-[0.05em] uppercase transition-colors duration-200'
const CHIP_OFF = 'border-hairline text-muted hover:border-hairline-strong hover:text-fg'
const CHIP_ON = 'border-accent bg-accent text-on-accent'

/**
 * Client-side filtering: the whole set is already in the HTML, so narrowing it
 * needs no round trip. The chips are derived from the project data upstream —
 * there is no filter list to keep in sync.
 */
export function ProjectsExplorer({
  projects,
  categories,
  stacks,
}: {
  projects: Project[]
  categories: CategoryFilter[]
  stacks: string[]
}) {
  const [category, setCategory] = useState<ProjectCategory | null>(null)
  const [stack, setStack] = useState<string | null>(null)

  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (category === null || project.category === category) &&
          (stack === null || project.stack.includes(stack)),
      ),
    [projects, category, stack],
  )

  const filtered = category !== null || stack !== null

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-sm border border-hairline bg-elevated/40 p-4">
        <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <legend className="sr-only">Filter by category</legend>
          <span
            aria-hidden="true"
            className="text-[10px] tracking-[0.07em] text-faint uppercase"
          >
            Category
          </span>
          {categories.map((item) => {
            const active = category === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? null : item.value)}
                className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
              >
                {item.label}
              </button>
            )
          })}
        </fieldset>

        <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <legend className="sr-only">Filter by stack</legend>
          <span
            aria-hidden="true"
            className="text-[10px] tracking-[0.07em] text-faint uppercase"
          >
            Stack
          </span>
          {stacks.map((item) => {
            const active = stack === item
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setStack(active ? null : item)}
                className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
              >
                {item}
              </button>
            )
          })}
        </fieldset>

        <div className="flex items-center justify-between gap-4 border-t border-hairline pt-3">
          <p aria-live="polite" className="text-[11px] text-muted">
            {visible.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setCategory(null)
                setStack(null)
              }}
              className="ease-console inline-flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
            >
              <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {visible.map((project) => (
            // h2 here: on this route the cards sit directly under the page h1,
            // with no Panel heading in between.
            <ProjectCard key={project.slug} project={project} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <p className="rounded-sm border border-hairline bg-elevated/40 px-4 py-10 text-center text-[14px] text-muted">
          Nothing matches that combination.
        </p>
      )}
    </div>
  )
}
