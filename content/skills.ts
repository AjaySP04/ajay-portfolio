import { z } from 'zod'

/**
 * Grouped by CAPABILITY, not by framework category — changed 2026-07-28.
 *
 * The résumé's own grouping ("Technical", "Web Frameworks", "Tools") answers
 * "which libraries has he touched". A reviewer hiring for AI infrastructure is
 * asking "what can he own", so the groups now lead with AI Engineering and
 * Distributed Systems and the languages come after, as implementation detail.
 *
 * Three deliberate omissions, each a credibility decision:
 *
 *   - No "Prompt Engineering". The positioning is an engineer who builds AI
 *     systems, not a prompt engineer; listing it as a headline capability argues
 *     the opposite. "Context engineering" is the systems framing of the same
 *     skill and stays.
 *   - No "Evaluation" / eval harnesses. Nothing in the résumé or the repos
 *     evidences one. It would be one of the strongest items here for AI-infra
 *     roles, so add it the moment it is true — but not before.
 *   - No Git, JIRA, Bash, HTML/CSS, MySQL, Linux, SOLID, TDD, SDLC. Listing
 *     version control and a ticket tracker on a staff-level page reads junior.
 *
 * Rust stays in `alsoShipped` rather than Languages: the only Rust here is
 * Tarjuman, which is still `status: 'building'`. Ranked beside Go and Python it
 * would read as inflation to anyone who clicks through.
 *
 * Still deliberately no proficiency ratings, years-per-skill or star bars: they
 * are unverifiable, every candidate inflates them, and a senior reader discounts
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
      id: 'ai',
      label: 'AI Engineering',
      items: [
        'LLM integration',
        'RAG',
        'Tool calling',
        'Agent workflows',
        'Context engineering',
        'Vector databases',
        'Model serving',
      ],
    },
    {
      id: 'distributed',
      label: 'Distributed Systems',
      items: [
        'gRPC',
        'Kafka',
        'Pub/Sub',
        'Redis',
        'Microservices',
        'Event-driven architecture',
        'High-throughput APIs',
      ],
    },
    {
      id: 'cloud',
      label: 'Cloud & Infrastructure',
      items: ['GCP', 'AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
    },
    {
      // The group that backs "systems that survive production". Every item is
      // evidenced at KPTAC (idempotent payments, webhook events, concurrency
      // control) or Audiomob (latency budgets at 2K req/sec).
      id: 'reliability',
      label: 'Reliability',
      items: [
        'Idempotent transaction design',
        'Webhook event handling',
        'Concurrency control',
        'Latency budgeting',
        'Load testing',
      ],
    },
    {
      id: 'languages',
      label: 'Languages',
      items: ['Go', 'Python', 'TypeScript', 'SQL'],
    },
    {
      id: 'data',
      label: 'Data',
      items: ['PostgreSQL', 'BigQuery', 'Bigtable', 'Redis', 'MongoDB'],
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
