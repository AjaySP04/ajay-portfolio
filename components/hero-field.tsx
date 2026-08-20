'use client'

import { useEffect, useRef } from 'react'
import { registerCanvas } from '@/components/sphere-runtime'

/**
 * The same orb field, redrawn inside the hero wash in a deeper tint.
 *
 * The hero background is opaque and sits above the page-level canvas, so
 * without this the hero would be a dead rectangle in the middle of the field.
 * Drawing the identical spheres here — offset by the hero's own position — makes
 * them read as one field passing behind the panel, and an orb crossing the
 * boundary visibly changes tint rather than disappearing.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return registerCanvas(canvas, 'hero')
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  )
}
