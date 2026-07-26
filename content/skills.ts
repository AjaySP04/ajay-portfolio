import { z } from 'zod'

/**
 * Groups are verbatim from the résumé's skills section, in résumé order.
 *
 * Deliberately no proficiency ratings, years-per-skill or star bars: they are
 * unverifiable, every candidate inflates them, and a senior reader discounts
 * them on sight. Where something was actually used is in Experience.
 */

const groupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
})

/** Used in production or shipped projects, but not on the résumé skills line. */
const alsoSchema = z.object({
  name: z.string().min(1),
  where: z.string().min(1),
})

export type SkillGroup = z.infer<typeof groupSchema>
export type AlsoShipped = z.infer<typeof alsoSchema>

const schema = z.object({
  groups: z.array(groupSchema).min(1),
  alsoShipped: z.array(alsoSchema).min(1),
})

export const skills = schema.parse({
  groups: [
    {
      id: 'technical',
      label: 'Technical',
      items: ['Python', 'Golang', 'JavaScript', 'TypeScript', 'SQL', 'Bash', 'HTML/CSS'],
    },
    {
      id: 'data',
      label: 'Database / Servers',
      items: [
        'PostgresSQL',
        'MongoDB',
        'Redis',
        'Bigtable',
        'BigQuery',
        'MySQL',
        'Linux/Unix',
        'NoSQL',
      ],
    },
    {
      id: 'web',
      label: 'Web Frameworks',
      items: [
        'FastAPI',
        'Gin (Golang)',
        'Django',
        'Node',
        'React.js',
        'Tailwind CSS',
        'WebRTC',
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        'JIRA',
        'Git',
        'Docker',
        'Google Cloud Platform',
        'AWS',
        'Apache Kafka',
        'Pub/Sub',
        'Kubernetes',
        'Terraform',
      ],
    },
    {
      id: 'architecture',
      label: 'Architecture & Practices',
      items: ['REST APIs', 'Microservices', 'gRPC', 'DevOps', 'TDD', 'SOLID', 'SDLC'],
    },
  ],
  alsoShipped: [
    { name: 'Rust', where: 'Tarjuman' },
    { name: 'Svelte 5', where: 'Audiomob dashboard' },
    { name: 'Vue.js', where: 'CovidTracker' },
    { name: 'Flask', where: 'Akamai RCM' },
    { name: 'REXX / PL/1 / DB2', where: 'Infosys' },
  ],
})
