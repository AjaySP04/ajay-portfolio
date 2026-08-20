import { describe, expect, it } from 'vitest'
import {
  EDGE_GAP,
  HOVER_SCALE,
  easeHover,
  reflectWalls,
  renderedRadius,
  resolveCollision,
  wander,
} from './geometry'
import type { Sphere } from './types'

function orb(over: Partial<Sphere> = {}): Sphere {
  const r = over.r ?? 40
  const base: Sphere = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r,
    m: r * r,
    speed: 0.2,
    hover: 1,
    hoverTarget: 1,
    phase: 0,
    // Breathing is off by default so a test that is not about breathing gets a
    // stable radius; the breathing tests opt in explicitly.
    period: 10_000,
    amplitude: 0,
    warm: false,
  }
  // Mass follows radius unless a test overrides it deliberately.
  return { ...base, ...over, m: over.m ?? (over.r ?? r) ** 2 }
}

const momentum = (a: Sphere, b: Sphere) => ({
  x: a.m * a.vx + b.m * b.vx,
  y: a.m * a.vy + b.m * b.vy,
})

describe('renderedRadius', () => {
  it('is the base radius when neither breathing nor hovering', () => {
    expect(renderedRadius(orb({ r: 50, amplitude: 0 }), 1234)).toBeCloseTo(50)
  })

  it('stays within the breathing amplitude at every phase', () => {
    const s = orb({ r: 50, amplitude: 0.15, period: 8_000 })
    for (let t = 0; t < 32_000; t += 137) {
      const r = renderedRadius(s, t)
      expect(r).toBeGreaterThanOrEqual(50 * 0.85 - 1e-9)
      expect(r).toBeLessThanOrEqual(50 * 1.15 + 1e-9)
    }
  })

  it('scales with hover, so a shrunk orb has a smaller collision footprint', () => {
    const s = orb({ r: 50, amplitude: 0, hover: HOVER_SCALE })
    expect(renderedRadius(s, 0)).toBeCloseTo(50 * HOVER_SCALE)
  })
})

describe('easeHover', () => {
  it('shrinks an orb the pointer is inside', () => {
    const s = orb({ r: 40, x: 100, y: 100 })
    for (let i = 0; i < 200; i += 1) {
      easeHover(s, { x: 100, y: 100, active: true }, 0)
    }
    expect(s.hover).toBeCloseTo(HOVER_SCALE, 4)
  })

  it('leaves an orb the pointer is outside alone', () => {
    const s = orb({ r: 40, x: 0, y: 0 })
    easeHover(s, { x: 500, y: 500, active: true }, 0)
    expect(s.hover).toBeCloseTo(1)
  })

  it('settles back to full size once the pointer leaves', () => {
    const s = orb({ r: 40, x: 100, y: 100, hover: HOVER_SCALE })
    for (let i = 0; i < 300; i += 1) {
      easeHover(s, { x: 0, y: 0, active: false }, 0)
    }
    expect(s.hover).toBeCloseTo(1, 4)
  })

  it('is monotonic while shrinking — never overshoots past the target', () => {
    const s = orb({ r: 40, x: 0, y: 0 })
    let previous = s.hover
    for (let i = 0; i < 100; i += 1) {
      easeHover(s, { x: 0, y: 0, active: true }, 0)
      expect(s.hover).toBeLessThanOrEqual(previous + 1e-12)
      expect(s.hover).toBeGreaterThanOrEqual(HOVER_SCALE - 1e-12)
      previous = s.hover
    }
  })
})

describe('wander', () => {
  it('pulls speed back toward the orb’s own cruising speed', () => {
    // Starts far too slow; wandering must recover, not random-walk away.
    const s = orb({ vx: 0.001, vy: 0, speed: 0.2 })
    for (let i = 0; i < 4_000; i += 1) wander(s, () => 0.5)
    expect(Math.hypot(s.vx, s.vy)).toBeCloseTo(0.2, 2)
  })

  it('bounds speed over a long run with real randomness', () => {
    const s = orb({ vx: 0.2, vy: 0, speed: 0.2 })
    let max = 0
    for (let i = 0; i < 20_000; i += 1) {
      wander(s, Math.random)
      max = Math.max(max, Math.hypot(s.vx, s.vy))
    }
    // Free random-walking would drift without limit; recovery keeps it near base.
    expect(max).toBeLessThan(0.2 * 3)
  })

  it('actually changes heading — it is not a straight line', () => {
    const s = orb({ vx: 0.2, vy: 0, speed: 0.2 })
    const before = Math.atan2(s.vy, s.vx)
    for (let i = 0; i < 500; i += 1) wander(s, Math.random)
    expect(Math.atan2(s.vy, s.vx)).not.toBeCloseTo(before, 6)
  })
})

describe('reflectWalls', () => {
  const bounds = { width: 1000, height: 800 }

  it('keeps an orb inside over a long run', () => {
    const s = orb({ r: 30, x: 40, y: 40, vx: -7, vy: -9, speed: 11 })
    for (let i = 0; i < 5_000; i += 1) {
      s.x += s.vx
      s.y += s.vy
      reflectWalls(s, bounds, 0)
      const r = renderedRadius(s, 0)
      expect(s.x).toBeGreaterThanOrEqual(r - 1e-9)
      expect(s.x).toBeLessThanOrEqual(bounds.width - r + 1e-9)
      expect(s.y).toBeGreaterThanOrEqual(r - 1e-9)
      expect(s.y).toBeLessThanOrEqual(bounds.height - r + 1e-9)
    }
  })

  it('reverses direction rather than merely clamping', () => {
    const s = orb({ r: 30, x: 5, y: 400, vx: -2, vy: 0 })
    reflectWalls(s, bounds, 0)
    expect(s.vx).toBeGreaterThan(0)
    expect(s.x).toBeCloseTo(30)
  })
})

describe('resolveCollision', () => {
  it('reports no contact when the pair is apart', () => {
    const a = orb({ r: 20, x: 0, y: 0 })
    const b = orb({ r: 20, x: 500, y: 0 })
    expect(resolveCollision(a, b, 0)).toBe(false)
  })

  it('conserves momentum for unequal masses', () => {
    const a = orb({ r: 60, x: 0, y: 0, vx: 3, vy: 1 })
    const b = orb({ r: 20, x: 70, y: 0, vx: -2, vy: 0.5 })
    const before = momentum(a, b)
    expect(resolveCollision(a, b, 0)).toBe(true)
    const after = momentum(a, b)
    expect(after.x).toBeCloseTo(before.x, 8)
    expect(after.y).toBeCloseTo(before.y, 8)
  })

  it('separates an overlapping pair', () => {
    const a = orb({ r: 40, x: 0, y: 0 })
    const b = orb({ r: 40, x: 10, y: 0 })
    resolveCollision(a, b, 0)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(80, 6)
  })

  it('does not re-overlap on the following step', () => {
    const a = orb({ r: 40, x: 0, y: 0, vx: 1, vy: 0 })
    const b = orb({ r: 40, x: 10, y: 0, vx: -1, vy: 0 })
    resolveCollision(a, b, 0)
    a.x += a.vx
    a.y += a.vy
    b.x += b.vx
    b.y += b.vy
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(80 - 1e-9)
  })

  it('pushes the lighter orb further out of the overlap', () => {
    const heavy = orb({ r: 80, x: 0, y: 0 })
    const light = orb({ r: 20, x: 60, y: 0 })
    const heavyBefore = heavy.x
    const lightBefore = light.x
    resolveCollision(heavy, light, 0)
    expect(Math.abs(light.x - lightBefore)).toBeGreaterThan(Math.abs(heavy.x - heavyBefore))
  })

  it('leaves a separating pair’s velocities untouched', () => {
    // Overlapping but already flying apart: applying an impulse here is what
    // makes orbs stick together and jitter.
    const a = orb({ r: 40, x: 0, y: 0, vx: -1, vy: 0 })
    const b = orb({ r: 40, x: 10, y: 0, vx: 1, vy: 0 })
    resolveCollision(a, b, 0)
    expect(a.vx).toBeCloseTo(-1)
    expect(b.vx).toBeCloseTo(1)
  })

  it('uses the rendered radius, so a shrunk orb stops colliding', () => {
    const gap = 62
    const big = () => orb({ r: 40, x: 0, y: 0 })
    const other = () => orb({ r: 40, x: gap, y: 0 })
    // At full size the surfaces overlap (40 + 40 > 62).
    expect(resolveCollision(big(), other(), 0)).toBe(true)
    // Shrink both to 62% and the same centres are clear (24.8 + 24.8 < 62).
    const a = big()
    const b = other()
    a.hover = HOVER_SCALE
    b.hover = HOVER_SCALE
    expect(resolveCollision(a, b, 0)).toBe(false)
  })
})

describe('EDGE_GAP', () => {
  it('is a positive surface-to-surface range', () => {
    expect(EDGE_GAP).toBeGreaterThan(0)
  })
})
