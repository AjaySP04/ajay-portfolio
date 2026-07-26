import { AboutSection } from '@/components/about-section'
import { ContactSection } from '@/components/contact-section'
import { ExperienceSection } from '@/components/experience-section'
import { FeaturedProjects } from '@/components/featured-projects'
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
      <FeaturedProjects />
      <ContactSection />
    </>
  )
}
