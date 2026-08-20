'use client'

import { useEffect, useRef } from 'react'
import { registerCanvas } from '@/components/sphere-runtime'

/**
 * The ambient orb field, behind everything.
 *
 * Deliberately 2D canvas rather than WebGL: a fraction of the cost and no GPU
 * drain over a long visit. The simulation itself lives in the shared runtime,
 * because the hero renders the same field in a different tint — see
 * `sphere-runtime.ts`.
 *
 * The vignette keeps the field from competing with body copy. Alpha is
 * theme-bound in CSS rather than here: a light canvas needs the orbs to be a
 * whisper, a dark one can carry them at full strength.
 */
export function SphereField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return registerCanvas(canvas, 'page')
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="size-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_42%,var(--color-canvas)_98%)]" />
    </div>
  )
}
