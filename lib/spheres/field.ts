import { candidatePairs } from './grid'
import {
  easeHover,
  reflectWalls,
  renderedRadius,
  resolveCollision,
  wander,
} from './geometry'
import type { Bounds, Pointer, Sphere } from './types'

/** One orb per this many square pixels, then clamped. */
export const AREA_PER_SPHERE = 42_000
export const MIN_SPHERES = 10
export const MAX_SPHERES = 30
export const RADIUS_MIN = 30
export const RADIUS_MAX = 100
export const SPEED_MIN = 0.09
export const SPEED_MAX = 0.26
/** Every Nth orb runs warm. A uniform field reads as wallpaper, not structure. */
export const WARM_EVERY = 6

export function sphereCount(bounds: Bounds): number {
  const area = bounds.width * bounds.height
  return Math.min(MAX_SPHERES, Math.max(MIN_SPHERES, Math.round(area / AREA_PER_SPHERE)))
}

/** `random` is injected so the generator is deterministic under test. */
export function seedField(bounds: Bounds, random: () => number = Math.random): Sphere[] {
  const count = sphereCount(bounds)
  const spheres: Sphere[] = []

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2
    const speed = SPEED_MIN + random() * (SPEED_MAX - SPEED_MIN)
    const r = RADIUS_MIN + random() * (RADIUS_MAX - RADIUS_MIN)

    spheres.push({
      x: r + random() * Math.max(1, bounds.width - r * 2),
      y: r + random() * Math.max(1, bounds.height - r * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      m: r * r,
      speed,
      hover: 1,
      hoverTarget: 1,
      phase: random() * Math.PI * 2,
      period: 6_000 + random() * 9_000,
      amplitude: 0.06 + random() * 0.13,
      warm: index % WARM_EVERY === 3,
    })
  }

  return spheres
}

/**
 * Advances the field one frame.
 *
 * Order matters. Hover and wander are integrated first so positions are current;
 * walls are clamped before pair resolution, so de-overlap cannot shove an orb
 * out of bounds and leave it there; pairs are resolved last.
 */
export function step(
  spheres: Sphere[],
  bounds: Bounds,
  pointer: Pointer,
  nowMs: number,
  random: () => number = Math.random,
): void {
  for (const s of spheres) {
    easeHover(s, pointer, nowMs)
    wander(s, random)
    s.x += s.vx
    s.y += s.vy
  }

  for (const s of spheres) reflectWalls(s, bounds, nowMs)

  for (const [a, b] of candidatePairs(spheres, (s) => renderedRadius(s, nowMs))) {
    resolveCollision(a, b, nowMs)
  }
}
