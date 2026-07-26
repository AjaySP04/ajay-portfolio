import { ArrowUpRight, CalendarClock, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from '@/components/contact-form'
import { Panel } from '@/components/panel'
import { Section } from '@/components/section'
import { contact, visibleDirectChannels } from '@/content/contact'
import { visibleChannels } from '@/content/site'

const ICONS = {
  whatsapp: MessageCircle,
  phone: Phone,
  calendar: CalendarClock,
} as const

export function ContactSection() {
  return (
    <Section id="contact" className="mt-24">
      <Panel title={contact.heading} headingId="contact-heading" meta="Replies to my personal inbox">
        <p className="border-b border-hairline px-5 py-4 text-[15px] leading-relaxed text-muted md:text-base">
          {contact.intro}
        </p>

        <div className="grid gap-px bg-hairline lg:grid-cols-[1fr_320px]">
          <div className="bg-canvas p-5">
            <h3 className="mb-5 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
              {contact.formTitle}
            </h3>
            <ContactForm
              copy={{
                fields: contact.fields,
                honeypotField: contact.honeypotField,
                submitLabel: contact.submitLabel,
                submittingLabel: contact.submittingLabel,
                successMessage: contact.successMessage,
                unconfiguredMessage: contact.unconfiguredMessage,
                genericErrorMessage: contact.genericErrorMessage,
              }}
            />
          </div>

          <div className="flex flex-col gap-px bg-hairline">
            <div className="bg-canvas p-5">
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
                {contact.directTitle}
              </h3>
              <ul className="space-y-2">
                {visibleDirectChannels.map((channel) => {
                  const Icon = ICONS[channel.icon]
                  return (
                    <li key={channel.id}>
                      <a
                        href={channel.href}
                        {...(channel.external
                          ? { target: '_blank', rel: 'noreferrer noopener' }
                          : {})}
                        className="ease-console group flex items-center gap-3 rounded-sm border border-hairline px-3 py-2.5 transition-colors duration-200 hover:border-hairline-strong hover:bg-elevated"
                      >
                        <Icon
                          className="size-4 shrink-0 text-accent-text"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block font-mono text-[12px] tracking-[0.08em] text-fg uppercase">
                            {channel.label}
                          </span>
                          {channel.value ? (
                            <span className="block font-mono text-[11px] text-muted">
                              {channel.value}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* flex-1 on the LAST block, not the first: the form column is
                taller, and the slack reads as intentional at the bottom of the
                column rather than as a gap between two groups. */}
            <div className="flex-1 bg-canvas p-5">
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
                {contact.elsewhereTitle}
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {visibleChannels.map((channel) => (
                  <li key={channel.id}>
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noreferrer noopener me"
                      className="ease-console inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-muted uppercase transition-colors duration-200 hover:border-hairline-strong hover:text-fg"
                    >
                      {channel.label}
                      <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  )
}
