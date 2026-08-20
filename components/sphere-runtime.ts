'use client'

import { EDGE_GAP, renderedRadius, seedField, step } from '@/lib/spheres'
import type { Pointer, Sphere } from '@/lib/spheres'

/**
 * One simulation, many canvases.
 *
 * The field has to appear twice: once behind the whole page in the ambient
 * cyan, and once inside the hero wash in a deeper tint, so the orbs read as a
 * single field continuing through the panel rather than stopping at its edge.
 * Running two simulations would drift out of sync within seconds and give away
 * the trick, and the page-level canvas cannot simply show through — the hero
 * wash is opaque and sits above it.
 *
 * So the field lives here, at module scope, and canvases subscribe to it. There
 * is exactly one rAF loop no matter how many are mounted, and a subscriber only
 * has to say which palette it wants.
 *
 * Offsets are derived from each canvas's own bounding rect, which means the
 * page canvas (fixed at inset-0, offset 0,0) and the hero canvas (offset by
 * wherever the hero currently sits) take the identical code path.
 */

type Kind = 'page' | 'hero'

type Palette = {
  cool: string
  warm: string
  alpha: number
  rim: number
  edge: number
}

type Subscriber = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  kind: Kind
  palette: Palette
}

const MAX_DPR = 1.5

const FALLBACK: Record<Kind, Palette> = {
  page: { cool: '11 192 220', warm: '217 142 11', alpha: 0.1, rim: 0.18, edge: 0.2 },
  hero: { cool: '6 110 128', warm: '176 116 10', alpha: 0.13, rim: 0.26, edge: 0.24 },
}

const VARIABLES: Record<Kind, Record<keyof Palette, string>> = {
  page: {
    cool: '--sphere',
    warm: '--sphere-warm',
    alpha: '--sphere-a',
    rim: '--sphere-rim',
    edge: '--sphere-edge-a',
  },
  hero: {
    cool: '--hero-sphere',
    warm: '--hero-sphere-warm',
    alpha: '--hero-sphere-a',
    rim: '--hero-sphere-rim',
    edge: '--hero-sphere-edge-a',
  },
}

const subscribers = new Set<Subscriber>()
const pointer: Pointer = { x: 0, y: 0, active: false }

let spheres: Sphere[] = []
let bounds = { width: 0, height: 0 }
let frame = 0
let animated = false
let listening = false
let reduceMotion: MediaQueryList | null = null
let smallScreen: MediaQueryList | null = null

function readPalette(kind: Kind): Palette {
  const styles = getComputedStyle(document.documentElement)
  const names = VARIABLES[kind]
  const fallback = FALLBACK[kind]
  const text = (name: string, or: string) => styles.getPropertyValue(name).trim() || or
  const number = (name: string, or: number) => {
    const value = Number.parseFloat(styles.getPropertyValue(name))
    return Number.isFinite(value) ? value : or
  }
  return {
    cool: text(names.cool, fallback.cool),
    warm: text(names.warm, fallback.warm),
    alpha: number(names.alpha, fallback.alpha),
    rim: number(names.rim, fallback.rim),
    edge: number(names.edge, fallback.edge),
  }
}

function refreshPalettes() {
  for (const sub of subscribers) sub.palette = readPalette(sub.kind)
}

function resizeCanvas(sub: Subscriber) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const width = sub.canvas.clientWidth
  const height = sub.canvas.clientHeight
  if (width === 0 || height === 0) return
  sub.canvas.width = Math.round(width * dpr)
  sub.canvas.height = Math.round(height * dpr)
  sub.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  sub.ctx.lineWidth = 1
}

function measure() {
  bounds = { width: window.innerWidth, height: window.innerHeight }
}

/**
 * Edges are drawn surface-to-surface rather than centre-to-centre. A centre
 * line runs straight through both orbs and reads as a scribble laid over them;
 * a surface line reads as a tether between them. Drawn before the fills so an
 * orb always sits on top of its own links.
 */
function drawEdges(sub: Subscriber, offsetX: number, offsetY: number, now: number) {
  const { ctx, palette } = sub
  if (!(palette.edge > 0)) return

  for (let i = 0; i < spheres.length; i += 1) {
    const a = spheres[i]!
    const ra = renderedRadius(a, now)
    for (let j = i + 1; j < spheres.length; j += 1) {
      const b = spheres[j]!
      const rb = renderedRadius(b, now)
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.hypot(dx, dy)
      if (distance === 0) continue
      const gap = distance - ra - rb
      // A touching pair needs no tether, and drawing one would invert the line.
      if (gap <= 2 || gap > EDGE_GAP) continue

      const nx = dx / distance
      const ny = dy / distance
      const strength = 1 - gap / EDGE_GAP
      ctx.strokeStyle = `rgb(${palette.cool} / ${strength * palette.edge})`
      ctx.beginPath()
      ctx.moveTo(a.x + nx * ra - offsetX, a.y + ny * ra - offsetY)
      ctx.lineTo(b.x - nx * rb - offsetX, b.y - ny * rb - offsetY)
      ctx.stroke()
    }
  }
}

function drawOrb(
  sub: Subscriber,
  s: Sphere,
  radius: number,
  offsetX: number,
  offsetY: number,
) {
  if (radius <= 0) return
  const { ctx, palette } = sub
  const channels = s.warm ? palette.warm : palette.cool
  const cx = s.x - offsetX
  const cy = s.y - offsetY

  const gradient = ctx.createRadialGradient(
    cx - radius * 0.3,
    cy - radius * 0.35,
    radius * 0.05,
    cx,
    cy,
    radius,
  )
  gradient.addColorStop(0, `rgb(${channels} / ${palette.alpha * 1.6})`)
  gradient.addColorStop(1, `rgb(${channels} / ${palette.alpha * 0.32})`)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgb(${channels} / ${palette.rim})`
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Clears the entire backing buffer, in device pixels.
 *
 * Deliberately not `clearRect(0, 0, cssWidth, cssHeight)` under the DPR
 * transform: at a fractional ratio that region rounds a half-pixel short of the
 * buffer, so a sliver of the previous frame survives at the right and bottom
 * edges and smears across an animated canvas. Resetting the transform for the
 * clear makes the region exact at any ratio.
 */
function clearBuffer(sub: Subscriber) {
  const { ctx, canvas } = sub
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

function draw() {
  const now = performance.now()

  for (const sub of subscribers) {
    const rect = sub.canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue

    clearBuffer(sub)
    drawEdges(sub, rect.left, rect.top, now)

    for (const s of spheres) {
      const radius = renderedRadius(s, now)
      // Skip anything that cannot land on this canvas. On the hero that is most
      // of the field, and it is drawn every frame.
      if (s.x + radius < rect.left || s.x - radius > rect.right) continue
      if (s.y + radius < rect.top || s.y - radius > rect.bottom) continue
      drawOrb(sub, s, radius, rect.left, rect.top)
    }
  }
}

function tick() {
  step(spheres, bounds, pointer, performance.now())
  draw()
  frame = window.requestAnimationFrame(tick)
}

function start() {
  if (frame) return
  frame = window.requestAnimationFrame(tick)
}

function stop() {
  if (frame) window.cancelAnimationFrame(frame)
  frame = 0
}

function reseed() {
  measure()
  if (bounds.width === 0 || bounds.height === 0) return
  spheres = seedField(bounds)
  for (const sub of subscribers) resizeCanvas(sub)
  draw()
}

function applyMode() {
  animated = !reduceMotion?.matches && !smallScreen?.matches
  stop()
  if (animated) {
    if (!document.hidden) start()
  } else {
    pointer.active = false
    draw()
  }
}

const onResize = () => reseed()
const onVisibility = () => {
  if (document.hidden) stop()
  else if (animated) start()
}
const onPointerMove = (event: PointerEvent) => {
  if (!animated) return
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.active = true
}
const clearPointer = () => {
  pointer.active = false
}

let themeObserver: MutationObserver | null = null

function attach() {
  if (listening) return
  listening = true

  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  smallScreen = window.matchMedia('(max-width: 767px)')

  reseed()
  applyMode()

  // next-themes flips a class on <html>; re-read the palette when it does so a
  // theme switch does not need a re-seed.
  themeObserver = new MutationObserver(() => {
    refreshPalettes()
    if (!animated) draw()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  reduceMotion.addEventListener('change', applyMode)
  smallScreen.addEventListener('change', applyMode)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', clearPointer)
  window.addEventListener('blur', clearPointer)
}

function detach() {
  if (!listening) return
  listening = false
  stop()
  themeObserver?.disconnect()
  themeObserver = null
  reduceMotion?.removeEventListener('change', applyMode)
  smallScreen?.removeEventListener('change', applyMode)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', clearPointer)
  window.removeEventListener('blur', clearPointer)
  spheres = []
}

/** Registers a canvas with the shared field. Returns its unsubscribe. */
export function registerCanvas(canvas: HTMLCanvasElement, kind: Kind): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const sub: Subscriber = { canvas, ctx, kind, palette: readPalette(kind) }
  subscribers.add(sub)

  attach()
  resizeCanvas(sub)

  const observer = new ResizeObserver(() => {
    resizeCanvas(sub)
    if (!animated) draw()
  })
  observer.observe(canvas)

  if (!animated) draw()

  return () => {
    observer.disconnect()
    subscribers.delete(sub)
    if (subscribers.size === 0) detach()
  }
}
