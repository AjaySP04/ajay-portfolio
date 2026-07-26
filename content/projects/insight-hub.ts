import { defineProject } from './schema'

export default defineProject({
  slug: 'insight-hub',
  title: 'Insight Hub',
  tagline: 'An LLM-backed productivity API and dashboard, built to get the integration patterns right.',
  description: [
    'A FastAPI service with environment-driven config and Docker Compose, paired with a separate React dashboard.',
    'Built to get hands-on with LLM integration patterns: prompt handling, API key and cost management, and keeping model calls from becoming a latency cliff in an otherwise fast request path.',
  ],
  role: 'Personal project',
  period: 'Mar – Apr 2024',
  status: 'archived',
  category: 'ai',
  stack: ['Python', 'FastAPI', 'OpenAI', 'Docker', 'React'],
  links: {
    repo: 'https://github.com/AjaySP04/insight-hub',
    docs: 'https://github.com/AjaySP04/productivity-dashboard',
  },
  featured: false,
  deepDive: false,
})
