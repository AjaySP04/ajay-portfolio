import { defineProject } from './schema'

export default defineProject({
  slug: 'covid-tracker',
  title: 'Covid-19 Tracker',
  tagline: 'A Vue dashboard over a public COVID-19 statistics API.',
  description: [
    'Charts country-level COVID-19 case data pulled live from a public REST API. The oldest project listed here, kept because it still runs.',
  ],
  role: 'Personal project',
  period: 'Sep 2021',
  status: 'archived',
  category: 'frontend',
  stack: ['Vue.js', 'REST APIs'],
  links: {
    demo: 'https://inspiring-tereshkova-bad57d.netlify.app/',
    repo: 'https://github.com/AjaySP04/CovidTracker',
  },
  featured: false,
  deepDive: false,
})
