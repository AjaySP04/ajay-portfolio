import { z } from 'zod'
import { CATEGORIES, STATUSES } from './taxonomy'

/**
 * One file per project, all validated at build time. Adding a project is a new
 * file plus one line in `index.ts`; reordering is moving that line.
 *
 * This module imports zod, so it is server-only in practice. Client components
 * may import *types* from here (erased at compile time) but must take runtime
 * values such as the label maps from `./taxonomy` instead.
 *
 * Note on `description`: modelled as an array of paragraphs rather than a
 * markdown string. Nothing in the copy needs markdown, and a parser would be a
 * dependency and a client payload bought for capability nobody is using. If a
 * project ever needs real long-form structure, that is what `deepDive` is for.
 */

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase, digits and hyphens only'),
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.array(z.string().min(1)).min(1),
  role: z.string().min(1),
  /** Derived from real repo history, not estimated. */
  period: z.string().min(1),
  status: z.enum(STATUSES),
  category: z.enum(CATEGORIES),
  /** Filter chips are derived from this union across all projects. */
  stack: z.array(z.string().min(1)).min(1),
  links: z
    .object({
      demo: z.url().optional(),
      repo: z.url().optional(),
      docs: z.url().optional(),
      writeup: z.url().optional(),
    })
    .refine((links) => Object.values(links).some(Boolean), {
      message: 'a project needs at least one link',
    }),
  metrics: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).optional(),
  cover: z.object({ src: z.string().startsWith('/'), alt: z.string().min(1) }).optional(),
  /** Surfaces on the homepage. */
  featured: z.boolean().default(false),
  /** Generates /projects/<slug>. Only set it where there is enough to read. */
  deepDive: z.boolean().default(false),
})

export type Project = z.infer<typeof projectSchema>

export function defineProject(project: z.input<typeof projectSchema>): Project {
  return projectSchema.parse(project)
}
