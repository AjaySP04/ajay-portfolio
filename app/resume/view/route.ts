import { resumeResponse } from '@/lib/resume'

export const dynamic = 'force-dynamic'

export function GET() {
  return resumeResponse('inline')
}
