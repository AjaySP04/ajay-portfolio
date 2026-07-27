import { describe, expect, it } from 'vitest'

/**
 * These modules parse themselves with Zod at import time, so importing them at
 * all is the assertion: a malformed entry throws here instead of shipping.
 */
describe('content schemas', () => {
  it('site config parses and exposes the expected shape', async () => {
    const { site, visibleChannels } = await import('./site')
    expect(site.name).toBeTruthy()
    expect(site.resume.filename).toMatch(/\.pdf$/)
    expect(site.nav.length).toBeGreaterThan(0)
    for (const item of site.nav) expect(item.href.startsWith('/')).toBe(true)
    expect(visibleChannels.every((channel) => channel.visible)).toBe(true)
  })

  it('canonical url is a bare https origin', async () => {
    const { site } = await import('./site')
    const url = new URL(site.url)
    expect(url.protocol).toBe('https:')
    // A trailing slash doubles up when composed into metadataBase-relative URLs.
    expect(site.url.endsWith('/')).toBe(false)
    expect(url.pathname).toBe('/')
    // Must be the host that actually serves, not one that redirects to it.
    expect(url.host).toBe('www.ajaysparmar.com')
  })

  it('every metric carries a source, so numbers are always attributable', async () => {
    const { site } = await import('./site')
    expect(site.metrics.items.length).toBeGreaterThan(0)
    for (const metric of site.metrics.items) {
      expect(metric.source.trim().length).toBeGreaterThan(0)
    }
    // The credibility guardrail: the strip must say these are not current-role.
    expect(site.metrics.disclaimer.toLowerCase()).toContain('not current-role')
  })

  it('experience, skills and about parse', async () => {
    const { roles } = await import('./experience')
    const { skills } = await import('./skills')
    const { about } = await import('./about')
    expect(roles.length).toBeGreaterThan(0)
    expect(roles.filter((role) => role.end === null)).toHaveLength(1)
    expect(skills.groups.length).toBeGreaterThan(0)
    expect(about.summary.length).toBeGreaterThan(0)
  })

  it('projects have unique slugs and at least one link each', async () => {
    const { projects } = await import('./projects')
    const slugs = projects.map((project) => project.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const project of projects) {
      expect(Object.values(project.links).filter(Boolean).length).toBeGreaterThan(0)
    }
  })

  it('only deepDive projects can produce a detail route', async () => {
    const { projects, deepDiveProjects } = await import('./projects')
    expect(deepDiveProjects.every((project) => project.deepDive)).toBe(true)
    expect(deepDiveProjects.length).toBeLessThanOrEqual(projects.length)
  })

  it('filter chips are derived from project data, not hand-maintained', async () => {
    const { projects, stackFilters } = await import('./projects')
    const union = new Set(projects.flatMap((project) => project.stack))
    expect(new Set(stackFilters)).toEqual(union)
  })

  it('contact config keeps the phone number out of rendered fields', async () => {
    const { contact, visibleDirectChannels } = await import('./contact')
    expect(contact.honeypotField.length).toBeGreaterThan(0)
    // Nothing a visitor sees should contain the digits — WhatsApp goes via the
    // /whatsapp redirect precisely so the number stays server-side.
    for (const channel of visibleDirectChannels) {
      expect(channel.href).not.toMatch(/9715\d{8}/)
      expect(channel.value).not.toMatch(/\d{6,}/)
    }
  })
})
