import { z } from 'zod'

/**
 * Contact configuration and copy.
 *
 * NOTE ON THE PHONE NUMBER: it is not published, per the working notes. There
 * is no `tel:` link and the digits are never rendered.
 *
 * WhatsApp still works without exposing it: the button points at the internal
 * /whatsapp route, which 302s to wa.me server-side. A direct wa.me href would
 * have put the number in the HTML, which is the thing being avoided. That also
 * gives Phase 6 a natural place to count the click.
 *
 * The email address is likewise absent — it lives in content/site.ts and is only
 * read server-side by app/api/contact/route.ts.
 */

const directChannelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** What the visitor sees. Empty string means "just show the label". */
  value: z.string(),
  href: z.string().min(1),
  icon: z.enum(['whatsapp', 'phone', 'calendar']),
  visible: z.boolean(),
  external: z.boolean().default(true),
})

const fieldSchema = z.object({
  name: z.enum(['name', 'email', 'message']),
  label: z.string().min(1),
  placeholder: z.string().min(1),
  maxLength: z.number().int().positive(),
})

const schema = z.object({
  heading: z.string().min(1),
  intro: z.string().min(1),
  formTitle: z.string().min(1),
  directTitle: z.string().min(1),
  elsewhereTitle: z.string().min(1),
  submitLabel: z.string().min(1),
  submittingLabel: z.string().min(1),
  successMessage: z.string().min(1),
  /** Shown when the API reports delivery is not configured. */
  unconfiguredMessage: z.string().min(1),
  genericErrorMessage: z.string().min(1),
  /** Name of the honeypot field. Must look plausible to a naive bot. */
  honeypotField: z.string().min(1),
  fields: z.array(fieldSchema).length(3),
  directChannels: z.array(directChannelSchema),
})

export type DirectChannel = z.infer<typeof directChannelSchema>
export type ContactField = z.infer<typeof fieldSchema>

/**
 * Server-only. Read exclusively by app/whatsapp/route.ts to build the redirect
 * target. Never put this in rendered output or the point of the redirect is lost.
 */
export const WHATSAPP_NUMBER = '971547611830'

export const contact = schema.parse({
  heading: 'Contact',
  intro:
    'Hiring, contract work, or a question about something I have built — the form reaches my personal inbox. For anything time-sensitive, WhatsApp is fastest.',
  // 'phone' stays in the icon union so a tel: entry can be re-added as pure
  // content later; there is deliberately no such entry today.
  formTitle: 'Send a message',
  directTitle: 'Direct',
  elsewhereTitle: 'Elsewhere',
  submitLabel: 'Send message',
  submittingLabel: 'Sending',
  successMessage: 'Message sent. I will get back to you shortly.',
  unconfiguredMessage:
    'The form is not connected to a mail provider yet. Use WhatsApp or LinkedIn in the meantime.',
  genericErrorMessage: 'That did not go through. Try WhatsApp or LinkedIn instead.',
  honeypotField: 'company_website',
  fields: [
    { name: 'name', label: 'Name', placeholder: 'Your name', maxLength: 100 },
    { name: 'email', label: 'Email', placeholder: 'you@company.com', maxLength: 200 },
    {
      name: 'message',
      label: 'Message',
      placeholder: 'What would you like to talk about?',
      maxLength: 4000,
    },
  ],
  directChannels: [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: 'Business account',
      // Internal route, not a wa.me href — see the note at the top of the file.
      href: '/whatsapp',
      icon: 'whatsapp',
      visible: true,
    },
    // A link, never an embed — a booking widget would ship more third-party
    // JavaScript than the rest of the site combined. Set visible: true and drop
    // the real URL in once the account exists.
    {
      id: 'booking',
      label: 'Book a call',
      value: '30 min, video',
      href: 'https://cal.com/ajaysparmar',
      icon: 'calendar',
      visible: false,
    },
  ],
})

export const visibleDirectChannels = contact.directChannels.filter((channel) => channel.visible)
