/**
 * Notification sent to Ajay when someone uses the contact form.
 *
 * Plain JSX with inline styles rather than @react-email/components — that
 * package is deprecated at its latest version, and its value is table-layout
 * helpers for complex marketing email. This is a one-column notification.
 */
export function ContactMessageEmail({
  name,
  email,
  message,
  receivedAt,
  clientIp,
  domain,
}: {
  name: string
  email: string
  message: string
  receivedAt: string
  clientIp: string
  /** Passed in rather than imported, so this stays a pure template. */
  domain: string
}) {
  const label = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#8a9199',
    margin: '0 0 4px',
  }

  const value = {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: '15px',
    color: '#14161a',
    margin: '0 0 20px',
    lineHeight: '1.5',
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '24px',
          backgroundColor: '#f3f4f6',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e3e6ea',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e3e6ea',
              backgroundColor: '#fbfbfc',
            }}
          >
            <p
              style={{
                ...label,
                margin: 0,
                color: '#14161a',
              }}
            >
              New message · {domain}
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            <p style={label}>From</p>
            <p style={value}>
              {name}
              <br />
              <a href={`mailto:${email}`} style={{ color: '#9a5b0a' }}>
                {email}
              </a>
            </p>

            <p style={label}>Message</p>
            <p style={{ ...value, whiteSpace: 'pre-wrap' }}>{message}</p>

            <p style={{ ...label, margin: 0 }}>
              Received {receivedAt} · {clientIp}
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
