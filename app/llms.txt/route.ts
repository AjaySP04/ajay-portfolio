import { about } from '@/content/about'
import { games } from '@/content/games'
import { roles } from '@/content/experience'
import { projects } from '@/content/projects'
import { skills } from '@/content/skills'
import { site } from '@/content/site'
import { absoluteUrl, SITE_DESCRIPTION } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * /llms.txt — a plain-text summary for language models.
 *
 * An emerging convention rather than a standard, and no crawler is obliged to
 * read it. It costs one generated file and gives an answer engine the facts in
 * the order that matters, instead of leaving it to infer them from markup. Built
 * from the same content modules as the pages, so it cannot go stale separately.
 */
export function GET() {
  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Location: ${site.location}`,
    `Site: ${site.url}`,
    `Résumé (PDF): ${absoluteUrl(site.resume.downloadPath)}`,
    '',
    '## About',
    '',
    ...about.summary,
    '',
    `Domains: ${about.domains.join(', ')}`,
    `Education: ${about.education.qualification}, ${about.education.institution} (${about.education.period}), GPA ${about.education.gpa}`,
    '',
    '## Experience',
    '',
  ]

  for (const role of roles) {
    lines.push(
      `### ${role.title}, ${role.company} (${role.start} – ${role.end ?? 'Present'}, ${role.location})`,
      '',
      ...role.bullets.map((bullet) => `- ${bullet}`),
      '',
    )
  }

  lines.push('## Skills', '')
  for (const group of skills.groups) {
    lines.push(`- ${group.label}: ${group.items.join(', ')}`)
  }
  lines.push(
    '',
    `Also shipped: ${skills.alsoShipped.map((item) => `${item.name} (${item.where})`).join(', ')}`,
    '',
    '## Selected metrics',
    '',
    `${site.metrics.disclaimer} ${site.metrics.footnote}`,
    '',
  )
  for (const metric of site.metrics.items) {
    lines.push(`- ${metric.value}${metric.unit ? ` ${metric.unit}` : ''} — ${metric.label} (${metric.source})`)
  }

  lines.push('', '## Projects', '')
  for (const project of projects) {
    lines.push(
      `### ${project.title} — ${project.status}, ${project.period}`,
      '',
      project.tagline,
      '',
      ...project.description,
      '',
      `Stack: ${project.stack.join(', ')}`,
      ...Object.entries(project.links)
        .filter(([, url]) => Boolean(url))
        .map(([kind, url]) => `${kind}: ${url}`),
      '',
    )
  }

  lines.push('## Pages', '')
  lines.push(`- ${absoluteUrl('/')} — home: positioning, career metrics, about, experience, skills, selected work, contact`)
  lines.push(`- ${absoluteUrl('/projects')} — all projects, filterable by category and stack`)
  lines.push(`- ${absoluteUrl('/play')} — browser games`)
  for (const game of games) {
    lines.push(`- ${absoluteUrl(game.href)} — ${game.title}: ${game.tagline}`)
  }

  lines.push(
    '',
    '## Contact',
    '',
    `Use the form at ${absoluteUrl('/#contact')}. The email address is intentionally not published on the site, and the phone number is not published at all.`,
    '',
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
