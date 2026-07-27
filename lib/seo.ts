import { site } from '@/content/site'

/** Absolute URL against the canonical host. Never hand-build these. */
export function absoluteUrl(path = '/'): string {
  return new URL(path, site.url).toString()
}

/**
 * Search engines and social cards want one description; humans want a sentence
 * that reads. This is the one place that decides what the site claims to be.
 */
export const SITE_DESCRIPTION = `${site.positioning.role} in ${site.location.split(',')[0]} — ${site.positioning.qualifier}. ${site.tagline[0]}`

export const SITE_KEYWORDS = [
  'Ajay Singh Parmar',
  'senior backend engineer',
  'senior developer Dubai',
  'Python developer',
  'Golang developer',
  'FastAPI',
  'distributed systems',
  'RTB AdTech engineer',
  'LLM engineer',
  'RAG pipelines',
  'agentic AI',
  'Kubernetes',
  'Terraform',
  'GCP',
  'AWS',
]

/**
 * The crawlers worth naming explicitly.
 *
 * Being in an answer engine's index is worth more to a job search than the
 * marginal risk of training use, so these are allowed rather than blocked.
 * Listing them by name matters: several read their own user-agent group and
 * ignore the wildcard, and Google-Extended / Applebot-Extended only control
 * AI use — blocking them does not affect normal search ranking either way.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
]
