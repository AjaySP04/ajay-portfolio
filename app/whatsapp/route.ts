import { WHATSAPP_NUMBER } from '@/content/contact'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Keeps the phone number out of the page. The contact button links here, and the
 * number only ever exists server-side in the Location header of this redirect —
 * so it is not in the HTML, the RSC payload, or any client chunk.
 *
 * Phase 6 can fire `channel_clicked{channel:'whatsapp'}` from here.
 */
export function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://wa.me/${WHATSAPP_NUMBER}`,
      // A cached redirect would hide the click from analytics later.
      'Cache-Control': 'no-store',
    },
  })
}
