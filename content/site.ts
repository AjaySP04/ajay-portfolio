import { z } from 'zod'

/**
 * Single control panel for the site. Everything here is content, not code —
 * editing this file is the supported way to change what the site says.
 * Validated at build time so a typo fails the build instead of shipping.
 */

const channelSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /**
     * Optional, because not every channel has a linkable profile. Discord
     * identifies people by username but only exposes /users/<numeric id>, which
     * is not derivable from the handle — so it ships as copyable text instead of
     * a link that would 404.
     */
    url: z.url().optional(),
    /** Shown verbatim when there is no url. */
    handle: z.string().min(1).optional(),
    visible: z.boolean(),
  })
  .refine((channel) => Boolean(channel.url ?? channel.handle), {
    message: 'a channel needs either a url or a handle',
  })

const metricSchema = z.object({
  value: z.string().min(1),
  unit: z.string().optional(),
  label: z.string().min(1),
  /** Which system the number actually came from. Never omit this. */
  source: z.string().min(1),
})

const actionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'ghost']),
  /** Named intent rather than an icon-library name, so content stays
   *  decoupled from whichever icon set the components use. */
  icon: z.enum(['download', 'read', 'external', 'arrow']),
  external: z.boolean().default(false),
})

const navItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // Root-relative, including the hash targets, so the same nav works from
  // /projects and any future route — not just from the homepage.
  href: z.string().startsWith('/'),
})

const siteSchema = z.object({
  name: z.string().min(1),
  /**
   * Canonical origin. The single source of truth for the domain — metadataBase,
   * OG/canonical URLs and the contact email all read it from here, so moving
   * domains is a one-line change rather than a hunt through six files.
   * No trailing slash: `new URL()` composition doubles it otherwise.
   */
  url: z.url().refine((value) => !value.endsWith('/'), 'omit the trailing slash'),
  /** Positioning line. Deliberately not a resume job title — those appear
   *  only in the Experience section. */
  positioning: z.object({
    role: z.string().min(1),
    qualifier: z.string().min(1),
  }),
  location: z.string().min(1),
  currentCompany: z.string().min(1),
  tagline: z.array(z.string().min(1)).min(1),
  email: z.email(),
  mail: z.object({
    /**
     * Sending identity for the contact form. Requires ajaysparmar.com to be
     * verified in Resend — until then Resend rejects it and the route falls
     * back to `fallbackFrom` automatically.
     */
    from: z.string().min(1),
    /** Resend's shared sender, which needs no domain verification. */
    fallbackFrom: z.string().min(1),
  }),
  resume: z.object({
    filename: z.string().regex(/\.pdf$/),
    downloadPath: z.string().startsWith('/'),
    viewPath: z.string().startsWith('/'),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  /**
   * Extra profiles for schema.org `sameAs`, never rendered as links.
   *
   * This is how Google is told "these URLs are the same person" so signals
   * consolidate onto one entity instead of competing.
   */
  sameAs: z.array(z.url()),
  /**
   * Search-console ownership tokens. Left empty until the properties exist —
   * an empty meta tag is worse than no meta tag, so they are only emitted when
   * actually set.
   */
  verification: z.object({
    google: z.string(),
    bing: z.string(),
  }),
  /** Section nav. Adding a section here is all it takes to surface it. */
  nav: z.array(navItemSchema).min(1),
  heroActions: z.array(actionSchema).min(1),
  metrics: z.object({
    heading: z.string().min(1),
    /** The credibility guardrail. Must state these are not current-role. */
    disclaimer: z.string().min(1),
    footnote: z.string().min(1),
    items: z.array(metricSchema).min(1),
  }),
  channels: z.array(channelSchema),
})

export type Site = z.infer<typeof siteSchema>
export type Metric = z.infer<typeof metricSchema>
export type HeroAction = z.infer<typeof actionSchema>
export type Channel = z.infer<typeof channelSchema>

export const site: Site = siteSchema.parse({
  name: 'Ajay Singh Parmar',
  // www, not the apex: Vercel serves www and 308-redirects ajaysparmar.com to
  // it. Canonical and OG URLs must name the host that actually answers, or
  // Phase 7 will point every canonical tag at a redirect. If this is ever
  // flipped in Vercel to make the apex canonical, change it here too.
  url: 'https://www.ajaysparmar.com',
  positioning: {
    // "Senior Engineer" is positioning, not a résumé title — those stay in the
    // Experience section. Both claims below are verifiable from the résumé:
    // the Audiomob RTB platform, and ML/LLM inference at Audiomob and KPTAC.
    role: 'Senior Engineer',
    qualifier: 'Real-time bidding · LLM inference · distributed systems at scale',
  },
  location: 'Dubai, United Arab Emirates',
  currentCompany: 'KPTAC Technologies',
  // Verbatim opening sentence of the résumé summary. The rest of the summary
  // lives in the About section, in the résumé's own words — the hero used to
  // carry a paraphrase of it, which just said the same thing twice.
  tagline: [
    'Senior full-stack engineer with 10+ years building scalable, cloud-native systems across AdTech, Hospitality, Healthtech, and Insurtech.',
  ],
  email: 'ajays.parmar04@gmail.com',
  mail: {
    from: 'Ajay Singh Parmar <hello@ajaysparmar.com>',
    fallbackFrom: 'Portfolio <onboarding@resend.dev>',
  },
  resume: {
    filename: 'ajay_singh_parmar_resume.pdf',
    downloadPath: '/resume',
    viewPath: '/resume/view',
    updatedAt: '2026-07-26',
  },
  sameAs: [
    // The previous Jekyll site. Still live and cited in submitted applications.
    'https://ajaysp04.github.io',
  ],
  verification: {
    google: '',
    bing: '',
  },
  nav: [
    { id: 'about', label: 'About', href: '/#about' },
    { id: 'experience', label: 'Experience', href: '/#experience' },
    { id: 'skills', label: 'Skills', href: '/#skills' },
    { id: 'projects', label: 'Projects', href: '/projects' },
    { id: 'writing', label: 'Writing', href: '/writing' },
    { id: 'games', label: 'Games', href: '/play' },
    { id: 'contact', label: 'Contact', href: '/#contact' },
  ],
  heroActions: [
    {
      id: 'resume-download',
      label: 'Download résumé',
      href: '/resume',
      variant: 'primary',
      icon: 'download',
    },
    {
      id: 'resume-view',
      label: 'Read it here',
      href: '/resume/view',
      variant: 'secondary',
      icon: 'read',
    },
    // Phase 3 repoints this at /projects. Until that route exists it goes
    // to the real source, rather than to a 404.
    {
      id: 'work',
      label: 'See the work',
      href: 'https://github.com/AjaySP04',
      variant: 'ghost',
      icon: 'external',
      external: true,
    },
  ],
  metrics: {
    heading: 'Career-wide outcomes',
    disclaimer: 'Peak figures from systems I built — not current-role metrics.',
    footnote:
      'Measured in production on the Audiomob RTB platform (Feb 2023 – May 2025), except where noted. Each number is attributed to the system it came from.',
    items: [
      {
        value: '10M+',
        unit: '/ day',
        label: 'Ad auctions served',
        source: 'Audiomob RTB',
      },
      {
        value: '~100',
        unit: 'ms',
        label: 'Response at p99',
        source: 'Audiomob RTB',
      },
      {
        value: '2K',
        unit: 'req/s',
        label: 'Sustained throughput',
        source: 'Audiomob RTB',
      },
      {
        value: '99.9',
        unit: '%',
        label: 'Uptime at peak load',
        source: 'Audiomob',
      },
      {
        value: '10+',
        unit: 'yrs',
        label: 'Shipping software',
        source: 'Career to date',
      },
    ],
  },
  channels: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/AjaySP04',
      visible: true,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ajay-singh-parmar',
      visible: true,
    },
    {
      id: 'medium',
      label: 'Medium',
      url: 'https://medium.com/@ajaysparmar',
      visible: true,
    },
    {
      id: 'x',
      label: 'X',
      url: 'https://x.com/ajays_parmar',
      visible: true,
    },
    {
      id: 'discord',
      label: 'Discord',
      // Handle, not a url: Discord only addresses profiles as
      // /users/<numeric id>, which cannot be derived from a username.
      handle: 'ajaysparmar',
      visible: true,
    },
  ],
})

export const visibleChannels = site.channels.filter((channel) => channel.visible)

/**
 * Visible channels that have a real profile URL.
 *
 * Separate from `visibleChannels` so link contexts — the footer, JSON-LD
 * `sameAs` — cannot accidentally render an anchor with an undefined href or
 * publish a username where a URL is required.
 */
export const linkableChannels = visibleChannels.filter(
  (channel): channel is typeof channel & { url: string } => Boolean(channel.url),
)
