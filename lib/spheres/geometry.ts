import type { Bounds, Pointer, Sphere } from './types'

/** Hovered orbs ease to this fraction of their size. */
export const HOVER_SCALE = 0.62
/** How fast hover eases, per frame. */
export const HOVER_EASE = 0.12
/** Random steering applied to velocity each frame. */
export const WANDER = 0.014
/** How hard a wandering orb is pulled back to its own cruising speed. */
export const SPEED_RECOVERY = 0.06
/** Orbs tether when the gap between their surfaces closes to within this. */
export const EDGE_GAP = 210

/**
 * The radius actually drawn, and — critically — the radius that collides.
 *
 * Breathing and hover are folded in here rather than applied at paint time. If
 * they were cosmetic, a shrunken orb would still shove its neighbours around
 * from its old footprint and the whole field would feel painted-on. Because
 * this is the single source of size, a breathing orb makes and breaks its own
 * contacts, and hovering one visibly slackens every link attached to it.
 */
export function renderedRadius(s: Sphere, nowMs: number): number {
  const breathe = 1 + Math.sin(nowMs / s.period + s.phase) * s.amplitude
  return s.r * breathe * s.hover
}

/** Eases `hover` toward its target. Separated so it can be tested in isolation. */
export function easeHover(s: Sphere, pointer: Pointer, nowMs: number): void {
  s.hoverTarget = 1
  if (pointer.active) {
    const radius = renderedRadius(s, nowMs)
    const dx = s.x - pointer.x
    const dy = s.y - pointer.y
    if (dx * dx + dy * dy < radius * radius) s.hoverTarget = HOVER_SCALE
  }
  s.hover += (s.hoverTarget - s.hover) * HOVER_EASE
}

/**
 * A random walk, not a straight line.
 *
 * Nudging the heading alone would let speed random-walk too — orbs would
 * gradually stall or run away. So the nudge is followed by a pull back toward
 * this orb's own cruising speed, which keeps the motion wandering but bounded.
 *
 * `random` is injected so tests are deterministic.
 */
export function wander(s: Sphere, random: () => number): void {
  s.vx += (random() - 0.5) * WANDER
  s.vy += (random() - 0.5) * WANDER
  const speed = Math.hypot(s.vx, s.vy) || 1e-6
  const scale = (speed + (s.speed - speed) * SPEED_RECOVERY) / speed
  s.vx *= scale
  s.vy *= scale
}

/** Reflects off the viewport edges and clamps back inside. */
export function reflectWalls(s: Sphere, bounds: Bounds, nowMs: number): void {
  const r = renderedRadius(s, nowMs)
  if (s.x - r < 0) {
    s.x = r
    s.vx = Math.abs(s.vx)
  } else if (s.x + r > bounds.width) {
    s.x = bounds.width - r
    s.vx = -Math.abs(s.vx)
  }
  if (s.y - r < 0) {
    s.y = r
    s.vy = Math.abs(s.vy)
  } else if (s.y + r > bounds.height) {
    s.y = bounds.height - r
    s.vy = -Math.abs(s.vy)
  }
}

/**
 * Elastic collision between two orbs, plus positional de-overlap.
 *
 * The impulse is applied along the contact normal only, and only when the pair
 * is actually approaching — resolving a separating pair is what makes orbs
 * stick together and jitter. De-overlap is split by inverse mass so a small orb
 * gets pushed out of a large one rather than the pair meeting in the middle.
 *
 * Returns true if the pair was in contact.
 */
export function resolveCollision(a: Sphere, b: Sphere, nowMs: number): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distance = Math.hypot(dx, dy)
  const minimum = renderedRadius(a, nowMs) + renderedRadius(b, nowMs)
  if (distance === 0 || distance >= minimum) return false

  const nx = dx / distance
  const ny = dy / distance
  const approaching = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny

  if (approaching < 0) {
    const impulse = (-2 * approaching) / (1 / a.m + 1 / b.m)
    a.vx -= (impulse * nx) / a.m
    a.vy -= (impulse * ny) / a.m
    b.vx += (impulse * nx) / b.m
    b.vy += (impulse * ny) / b.m
  }

  const penetration = minimum - distance
  const inverseSum = 1 / a.m + 1 / b.m
  a.x -= (nx * penetration * (1 / a.m)) / inverseSum
  a.y -= (ny * penetration * (1 / a.m)) / inverseSum
  b.x += (nx * penetration * (1 / b.m)) / inverseSum
  b.y += (ny * penetration * (1 / b.m)) / inverseSum
  return true
}
