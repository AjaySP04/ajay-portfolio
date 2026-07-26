import { AboutSection } from '@/components/about-section'
import { ExperienceSection } from '@/components/experience-section'
import { Hero } from '@/components/hero'
import { MetricsStrip } from '@/components/metrics-strip'
import { SkillsSection } from '@/components/skills-section'

export default function HomePage() {
  return (
    <>
      <Hero />
      <MetricsStrip />
      <AboutSection />
      <ExperienceSection />
      <SkillsSection />
    </>
  )
}
