import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { site } from '@/content/site'

/**
 * Single source of truth: overwriting this one file updates the site.
 * `next.config.ts` declares it in `outputFileTracingIncludes` — the tracer
 * cannot see through a runtime path.join, so without that the serverless
 * bundle ships without the PDF.
 */
const RESUME_FILE = path.join(process.cwd(), 'public', 'resume', site.resume.filename)

/**
 * Serving the PDF through a route handler rather than as a static asset is what
 * guarantees the downloaded filename — a shared or pasted link lands as
 * `ajay_singh_parmar_resume.pdf` just like a button click does.
 */
export async function resumeResponse(disposition: 'attachment' | 'inline') {
  let file: Buffer

  try {
    file = await readFile(RESUME_FILE)
  } catch {
    return new Response('Résumé not available.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${site.resume.filename}"`,
      'Content-Length': String(file.byteLength),
      // Always revalidate: the point of the fixed path is that dropping in a
      // new PDF takes effect without anyone busting a cache by hand.
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
