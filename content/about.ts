import { z } from 'zod'

/**
 * The résumé's professional summary, verbatim, split at sentence boundaries for
 * readability — no wording changed.
 *
 * The summary's opening sentence is intentionally absent: the hero prints it
 * word for word, and repeating it one scroll later reads as padding.
 */

const factSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

const schema = z.object({
  summary: z.array(z.string().min(1)).min(1),
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
    'I architect backend-heavy systems in Python and Golang on GCP and AWS, combining deep distributed-systems expertise with sharp debugging instincts for complex, high-throughput environments.',
    'I bring LLMs and agentic AI into production—integrating large language models, designing RAG pipelines with vector databases, and building tool-using agent workflows—and command the MLOps and inference-serving patterns that ship AI from prototype to reliable service.',
    'I lead teams through ambiguity and thrive where AI is reshaping how systems get built.',
  ],
  // 400px derivative of the 1400px master, which stays in the repo for the
  // Phase 7 OG image. Rendered at 200px, so this is the 2x asset.
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
    'Exploring cultures through travel',
    'Photography',
    'Building automation tools',
    'Badminton',
    'Cricket',
  ],
  facts: [
    { label: 'Based in', value: 'Dubai, United Arab Emirates' },
    { label: 'Shipping since', value: '2016' },
    { label: 'Primary languages', value: 'Python · Golang · TypeScript' },
    { label: 'Clouds', value: 'GCP · AWS' },
  ],
})
