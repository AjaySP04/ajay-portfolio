import { defineProject } from './schema'

export default defineProject({
  slug: 'convenience-fee-calculator',
  title: 'Convenience Fee Calculator',
  tagline:
    'A faithful browser replica of a production payment-commission engine — so stakeholders can interrogate the maths before the feature ships.',
  description: [
    'Mirrors a production commission calculator exactly: integer-cent arithmetic with no floating point, gross-up so the merchant nets the intended amount, FIXED / PERCENTAGE / TIERED strategies, fee caps and thresholds, VAT handling, and basis-point partner revenue splits where the last partner absorbs the rounding remainder.',
    'Every config knob is editable and the full audit snapshot is exposed, so product and finance can stress-test edge cases without filing a ticket.',
    'It doubles as the reference spec the dashboard team built their own calculator against.',
  ],
  role: 'Personal project',
  period: 'May – Jun 2026',
  status: 'live',
  category: 'frontend',
  stack: ['React', 'Vite', 'JavaScript'],
  links: {
    demo: 'https://convenience-fee-calculator.vercel.app',
    repo: 'https://github.com/AjaySP04/convenience-fee-calculator',
  },
  metrics: [
    { label: 'Arithmetic', value: 'Integer cents, no float' },
    { label: 'Strategies', value: 'Fixed · Percentage · Tiered' },
    { label: 'Partner splits', value: 'Basis points' },
  ],
  featured: true,
  deepDive: true,
})
