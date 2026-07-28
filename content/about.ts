import { z } from 'zod'

/**
 * About copy. NO LONGER verbatim résumé text — that changed with the 2026-07-28
 * repositioning, and this comment is the record of it.
 *
 * `summary` used to be the résumé's professional summary word for word. It is now
 * site prose organised as who / what / how, because the résumé's own phrasing is
 * written for an ATS and reads like one. Every *claim* still traces to the
 * résumé — the decade, the four domains, the AI work — and the résumé PDF is one
 * click away on the same page, so wording may diverge but facts may not.
 *
 * Keep the "10+ years" and the domain names somewhere in `summary`: they are the
 * only indexable copy carrying those keywords now that the hero dropped them.
 */

const factSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

const buildSchema = z.object({
  label: z.string().min(1),
  /** The hard part of building that thing, not a description of it. */
  detail: z.string().min(1),
})

const schema = z.object({
  /** "Who I am" — where I came from and what I work on now. */
  summary: z.array(z.string().min(1)).min(1),
  /**
   * "What I build".
   *
   * Deliberately label + detail rather than a list of nouns. Eight nouns is a
   * tag cloud, and the Skills section already answers "which technologies" one
   * scroll later — this has to answer "what is hard about it" or it is a weaker
   * duplicate placed earlier.
   */
  builds: z.array(buildSchema).min(1),
  /** "How I think" — the closing argument, and the AI-as-continuity story. */
  outlook: z.array(z.string().min(1)).min(1),
  quote: z.object({
    text: z.string().min(1),
    attribution: z.string().min(1),
    era: z.string().min(1),
  }),
  portrait: z.object({
    src: z.string().startsWith('/'),
    alt: z.string().min(1),
    /** Intrinsic size of the asset, so the box is reserved before it loads. */
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  domains: z.array(z.string().min(1)).min(1),
  education: z.object({
    institution: z.string().min(1),
    qualification: z.string().min(1),
    period: z.string().min(1),
    gpa: z.string().min(1),
    extras: z.array(z.string().min(1)),
  }),
  interests: z.array(z.string().min(1)).min(1),
  facts: z.array(factSchema).min(1),
})

export type Fact = z.infer<typeof factSchema>

export const about = schema.parse({
  summary: [
    'I am a software engineer who likes the problems that only show up under load.',
    'Over the last decade — 10+ years now — I have designed distributed backend systems, cloud platforms and high-throughput services across AdTech, hospitality, healthcare and insurance, including payment flows where correctness is not negotiable.',
    'Today my focus is production AI systems: retrieval over real transactional data, tool-using agent workflows, and the serving and orchestration layers that decide whether any of it holds up outside a demo.',
  ],
  builds: [
    {
      label: 'AI systems',
      detail:
        'Retrieval over live transactional data, tool-calling agents, and keeping a model call from becoming the slowest hop in an otherwise fast request path.',
    },
    {
      label: 'Backend platforms',
      detail:
        'Multi-tenant services where reservations and money meet, with idempotent transaction handling and real consistency guarantees rather than hopeful ones.',
    },
    {
      label: 'Infrastructure',
      detail:
        'Terraform-managed GCP and AWS, Kubernetes, and enough instrumentation to know a system is degrading before a user tells me.',
    },
  ],
  /**
   * Deliberately no "good engineers / great engineers" framing.
   *
   * The idea was right but the phrasing rates the author against an unnamed
   * out-group, which is the one move that reads as a LinkedIn post rather than
   * as engineering. Naming actual failure modes does the same job and is the
   * thing a senior reader recognises.
   */
  outlook: [
    'Languages, frameworks and models turn over every few years. The reasons systems fall over do not: unbounded queues, retries without backoff, state that two services both believe they own.',
    'So I optimise for understanding systems deeply enough that the next generation of tooling is a detail rather than a re-education. That is why moving into AI infrastructure felt like continuity rather than a change of career — an inference call is just another dependency with a latency budget, a failure mode and a cost per request.',
  ],
  /**
   * Tirukkuṛaḷ 423, by Valluvar — an ancient Tamil proverb with a named author,
   * from a text that is 1,330 couplets of exactly this kind of worldly advice.
   *
   * Chosen over a Vedic hymn line because it is a proverb rather than a prayer,
   * and over Āryabhaṭa's rotating-Earth verse because that was an argument, not
   * an aphorism. The point here is judging a claim on its merit rather than on
   * who made it — which is the whole job.
   *
   * Dating of the Kuṛaḷ is debated (roughly 300 BCE–500 CE); "c. 5th century CE"
   * is the conservative common estimate.
   */
  quote: {
    text: 'To discern the truth in everything, by whomsoever spoken, is wisdom.',
    attribution: 'Valluvar',
    era: 'Tirukkuṛaḷ 423, c. 5th century CE',
  },
  portrait: {
    src: '/images/profile-400.jpg',
    alt: 'Ajay Singh Parmar',
    width: 400,
    height: 400,
  },
  domains: ['AdTech', 'Hospitality', 'Healthtech', 'Insurtech'],
  education: {
    institution: 'Jabalpur Engineering College',
    qualification: "Bachelor's, Information Technology",
    period: 'July 2012 – June 2016',
    gpa: '8.0',
    extras: ['Committee member, Curiosity Club', 'Co-ordinator, Training & Placement Office'],
  },
  interests: [
    'Automation tools for daily productivity',
    'Exploring cultures through travel',
    'Photography',
    'Bowling',
    'Go-karting',
    'Badminton',
    'Cricket',
  ],
  facts: [
    { label: 'Based in', value: 'Dubai, United Arab Emirates' },
    { label: 'Shipping since', value: '2016' },
    // "Go", matching the Skills panel on the same page. "Golang" survives in
    // SITE_KEYWORDS and the Experience bullets, so the search term is not lost.
    { label: 'Primary languages', value: 'Go · Python · TypeScript' },
    { label: 'Clouds', value: 'GCP · AWS' },
  ],
})
