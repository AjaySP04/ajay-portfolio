import { z } from 'zod'

/**
 * Career history. Array order is display order — newest first.
 *
 * Bullets are verbatim from the résumé. They are the one place exact job titles
 * appear on the site; everywhere else uses the "Senior Developer" positioning
 * line. The Audiomob entry is also what attributes the homepage metrics strip to
 * a specific platform and date range.
 */

const roleSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  start: z.string().min(1),
  /** `null` means current. */
  end: z.string().min(1).nullable(),
  /** Shown as a compact range in the timeline rail. */
  years: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
})

export type Role = z.infer<typeof roleSchema>

const rolesSchema = z.array(roleSchema).min(1)

export const roles: Role[] = rolesSchema.parse([
  {
    id: 'kptac',
    company: 'KPTAC Technologies',
    title: 'Senior Backend Engineer',
    location: 'Dubai, United Arab Emirates',
    start: 'May 2025',
    end: null,
    years: '2025 —',
    bullets: [
      'Own end-to-end backend architecture for a multi-tenant hospitality SaaS platform (Digital eMenu), defining system design, API contracts, and data models across Orders, Payments, Reservations, Restaurant Management, Notifications, and CRM.',
      'Architect scalable, fault-tolerant microservices handling high-volume restaurant transactions and real-time order flows, with concurrency control and strong consistency guarantees across reservation and payment systems.',
      'Engineer secure payment integrations with idempotent transaction processing and webhook-based event handling, ensuring reliability under production load.',
      'Integrate AI/LLM-driven features into the platform—menu recommendations, automated guest insights, and context-aware notifications—building RAG pipelines and LLM API integrations against transactional data.',
      'Set technical direction for the team—driving architectural decisions, defining engineering standards, and mentoring engineers to raise delivery quality and velocity.',
      'Partner directly with product, mobile, and frontend teams to translate business workflows into reliable backend systems, serving as the technical anchor across the stack.',
    ],
  },
  {
    id: 'audiomob',
    company: 'Audiomob Limited',
    title: 'Senior Software Engineer',
    location: 'Abu Dhabi, United Arab Emirates',
    start: 'February 2023',
    end: 'May 2025',
    years: '2023 — 2025',
    bullets: [
      "Architected Audiomob's RTB platform from PoC to production, doubling throughput to 2K req/sec and sustaining ~100ms responses for 99% of 10M+ daily auctions through optimized GCP infrastructure (Bigtable, Redis) and custom pacing algorithms.",
      'Built a gRPC service layer integrating ML models (CTR, LTR, CPI) for real-time ad targeting, cutting inference latency 30% and lifting ROI 25%.',
      'Engineered low-latency infrastructure with Terraform, sustaining 99.9% uptime at peak load and re-architecting database schemas to halve query latency.',
      'Redesigned the SSP Developer Dashboard (Svelte 5, Tailwind CSS) to cut user task time 40%, and automated BigQuery pipelines for real-time campaign tracking, reducing reporting lag 70%.',
      'Owned the full system lifecycle—R&D, infrastructure, CI/CD, and cross-team alignment—ensuring platform performance met business KPIs.',
    ],
  },
  {
    id: 'akamai',
    company: 'Akamai Technologies',
    title: 'Senior Software Engineer',
    location: 'Bangalore, KA, India',
    start: 'March 2022',
    end: 'January 2023',
    years: '2022 — 2023',
    bullets: [
      'Engineered scalable REST API features for Router Configuration Management System (RCM) using Flask and React.js, handling configurations for 10k+ routers to streamline network operations.',
      'Spearheaded backend database migration tool development for RCM, transitioning legacy systems to a dynamic environment and reducing configuration time by 30%.',
      'Orchestrated full-stack workflows (GitHub/Jira/Jenkins) and collaborated with cross-functional teams to enhance network tools, cutting incident resolution time by 25%.',
    ],
  },
  {
    id: 'adcuratio',
    company: 'Adcuratio Media Inc.',
    title: 'Software Development Engineer II',
    location: 'Bangalore, KA, India',
    start: 'February 2021',
    end: 'March 2022',
    years: '2021 — 2022',
    bullets: [
      'Architected an event-driven Multi-Seller Platform using FastAPI with real-time notifications/logging (Kafka), enabling scalable transaction handling.',
      'Led end-to-end development of core services (Subscriptions/Payments/Reviews) for Folksmedia Streaming (Python), mentoring juniors to boost team output.',
      'Optimized API performance by 40% by applying SOLID principles and microservices architecture in cloud-native systems; designed DSP backend supporting addressable ads for agencies.',
    ],
  },
  {
    id: 'meddiff',
    company: 'Meddiff Technologies (Now Ramsoft)',
    title: 'Software Engineer',
    location: 'Bangalore, KA, India',
    start: 'March 2019',
    end: 'January 2021',
    years: '2019 — 2021',
    bullets: [
      'Built a Quality Audit feature for the RIS/PACS server, increasing operational transparency and streamlining radiology workflows.',
      'Pioneered a Tele-ultrasound web app (Python, Django, React), rapidly delivering remote ultrasound interoperability during COVID-19 to reduce in-person exposure risk, taking it from concept to working POC end to end.',
      'Automated quality audits and server monitoring across a 50+ machine PACS fleet (Linux/Windows) and modernized the hospital inventory stack, cutting manual workflows 40% and enabling real-time radiology performance tracking.',
    ],
  },
  {
    id: 'infosys',
    company: 'Infosys Limited',
    title: 'Senior System Engineer',
    location: 'Mangalore, KA, India',
    start: 'December 2016',
    end: 'March 2019',
    years: '2016 — 2019',
    bullets: [
      'Implemented a critical policy-change feature for Universal Life and Whole Life insurance underwriting, enabling accurate handling of mid-term policy adjustments.',
      'Restructured a core correspondence application with SOLID-principled Python backend code, improving performance and maintainability and boosting processing throughput by 20%.',
      'Developed high-performance mainframe tools in REXX and PL/1 for CRUD operations on a DB2 database, improving reliability and reducing processing time.',
    ],
  },
])

export const currentRole = roles.find((role) => role.end === null)
