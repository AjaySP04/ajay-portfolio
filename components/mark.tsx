/** Three nodes, two edges — the node graph reduced to a monogram. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 15 L10 5 L16 12" strokeLinecap="square" opacity="0.55" />
      <circle cx="4" cy="15" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="10" cy="5" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  )
}
