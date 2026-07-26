import { resumeResponse } from '@/lib/resume'

// Read at request time, not build time, so Phase 6 has a server-side hook for
// the `resume_downloaded` event and a fresh PDF never needs a rebuild.
export const dynamic = 'force-dynamic'

export function GET() {
  return resumeResponse('attachment')
}
