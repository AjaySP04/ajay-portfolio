import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ProjectsExplorer } from '@/components/projects-explorer'
import { categoryFilters, projects, stackFilters } from '@/content/projects'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Things Ajay Singh Parmar has built outside of client work — offline speech AI in Rust, a production payment-commission engine replica, and LLM integration experiments.',
}

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        kicker="Projects"
        title="Things built outside the day job"
        intro="Personal builds, in order of how much they say about the work. Every one links to its source; where a hosted demo exists it is linked too, and where one does not, it is because it is not currently deployed."
      />

      <div className="mx-auto max-w-6xl px-6 pb-8">
        <ProjectsExplorer
          projects={projects}
          categories={categoryFilters}
          stacks={stackFilters}
        />
      </div>
    </>
  )
}
