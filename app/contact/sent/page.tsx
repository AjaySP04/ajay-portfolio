import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { contact } from '@/content/contact'

export const metadata: Metadata = {
  title: 'Message sent',
  robots: { index: false, follow: false },
}

/**
 * Where a JavaScript-free form submission lands. Static, so the homepage does
 * not have to read a query parameter and lose its own static rendering.
 */
export default function ContactSentPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
      <div className="max-w-xl rounded-sm border border-hairline bg-elevated/60 p-6">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-live uppercase">
          <CircleCheck className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Sent
        </p>
        <h1 className="mt-4 font-mono text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.03em] text-fg">
          Message sent
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{contact.successMessage}</p>
        <Link
          href="/#contact"
          className="ease-console mt-8 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-accent-text uppercase transition-colors duration-200 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Back to the site
        </Link>
      </div>
    </div>
  )
}
