import { roles } from '@/content/experience'
import { about } from '@/content/about'
import { skills } from '@/content/skills'
import { site, visibleChannels } from '@/content/site'
import { absoluteUrl, SITE_DESCRIPTION } from '@/lib/seo'

/**
 * JSON-LD for the site as a whole.
 *
 * This is the highest-leverage SEO work here and it matters twice over: Google
 * uses it to build a knowledge panel for a person, and answer engines lean on it
 * heavily because it states plainly what prose only implies — who this is, what
 * they do, where, and which accounts are the same person.
 *
 * Everything is derived from the content modules, so it cannot drift from the
 * visible page.
 */
export function StructuredData() {
  const current = roles.find((role) => role.end === null)

  const person = {
    '@type': 'Person',
    '@id': absoluteUrl('/#person'),
    name: site.name,
    url: site.url,
    image: absoluteUrl(about.portrait.src),
    jobTitle: current?.title ?? site.positioning.role,
    description: SITE_DESCRIPTION,
    email: `mailto:${site.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
    worksFor: current
      ? { '@type': 'Organization', name: current.company }
      : undefined,
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: about.education.institution,
    },
    knowsAbout: [
      ...skills.groups.flatMap((group) => group.items),
      ...about.domains,
    ],
    // sameAs is what links these profiles into one entity for a knowledge panel,
    // and what tells Google the old Jekyll site is the same person rather than a
    // competing result.
    sameAs: [...visibleChannels.map((channel) => channel.url), ...site.sameAs],
  }

  const website = {
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    url: site.url,
    name: site.name,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': absoluteUrl('/#person') },
  }

  const profilePage = {
    '@type': 'ProfilePage',
    '@id': absoluteUrl('/#profile'),
    url: site.url,
    name: `${site.name} — ${site.positioning.role}`,
    isPartOf: { '@id': absoluteUrl('/#website') },
    about: { '@id': absoluteUrl('/#person') },
    // Signals to an answer engine that the page is authored by its subject.
    mainEntity: { '@id': absoluteUrl('/#person') },
  }

  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': [person, website, profilePage] }} />
}

/**
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` output is escaped for `</script>` because a stray closing tag
 * inside a string would end the script element early — the classic JSON-LD
 * injection footgun.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
