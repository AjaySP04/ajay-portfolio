import { describe, expect, it } from 'vitest'
import {
  MAX_SPHERES,
  MIN_SPHERES,
  RADIUS_MAX,
  RADIUS_MIN,
  SPEED_MAX,
  SPEED_MIN,
  WARM_EVERY,
  seedField,
  sphereCount,
  step,
} from './field'
import { renderedRadius } from './geometry'

function rng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

const IDLE = { x: -1, y: -1, active: false }

describe('sphereCount', () => {
  it('clamps a tiny viewport up to the floor', () => {
    expect(sphereCount({ width: 320, height: 480 })).toBe(MIN_SPHERES)
  })

  it('clamps a huge viewport down to the ceiling', () => {
    expect(sphereCount({ width: 5120, height: 2880 })).toBe(MAX_SPHERES)
  })

  it('scales between the bounds', () => {
    const count = sphereCount({ width: 1440, height: 900 })
    expect(count).toBeGreaterThanOrEqual(MIN_SPHERES)
    expect(count).toBeLessThanOrEqual(MAX_SPHERES)
  })
})

describe('seedField', () => {
  const bounds = { width: 1440, height: 900 }

  it('is deterministic for a given random source', () => {
    const a = seedField(bounds, rng(42))
    const b = seedField(bounds, rng(42))
    expect(a).toEqual(b)
  })

  it('respects the radius and speed ranges', () => {
    for (const s of seedField(bounds, rng(5))) {
      expect(s.r).toBeGreaterThanOrEqual(RADIUS_MIN)
      expect(s.r).toBeLessThanOrEqual(RADIUS_MAX)
      expect(s.speed).toBeGreaterThanOrEqual(SPEED_MIN)
      expect(s.speed).toBeLessThanOrEqual(SPEED_MAX)
      expect(Math.hypot(s.vx, s.vy)).toBeCloseTo(s.speed, 6)
    }
  })

  it('gives mass proportional to area', () => {
    for (const s of seedField(bounds, rng(6))) {
      expect(s.m).toBeCloseTo(s.r * s.r, 6)
    }
  })

  it('starts every orb inside the viewport', () => {
    for (const s of seedField(bounds, rng(8))) {
      expect(s.x).toBeGreaterThanOrEqual(s.r)
      expect(s.y).toBeGreaterThanOrEqual(s.r)
    }
  })

  it('gives each orb its own breathing period and phase', () => {
    const spheres = seedField(bounds, rng(9))
    expect(new Set(spheres.map((s) => s.period)).size).toBeGreaterThan(1)
    expect(new Set(spheres.map((s) => s.phase)).size).toBeGreaterThan(1)
  })

  it('marks roughly one orb in six as warm, and at least one', () => {
    const spheres = seedField(bounds, rng(10))
    const warm = spheres.filter((s) => s.warm).length
    expect(warm).toBeGreaterThan(0)
    expect(warm).toBe(spheres.filter((_, i) => i % WARM_EVERY === 3).length)
    expect(warm).toBeLessThan(spheres.length / 2)
  })
})

describe('step', () => {
  const bounds = { width: 1280, height: 800 }

  it('keeps every orb inside the viewport over a long run', () => {
    const spheres = seedField(bounds, rng(13))
    const random = rng(99)
    for (let frame = 0; frame < 2_000; frame += 1) {
      step(spheres, bounds, IDLE, frame * 16, random)
    }
    for (const s of spheres) {
      const r = renderedRadius(s, 2_000 * 16)
      // De-overlap runs after the wall clamp, so a crowded corner can nudge an
      // orb marginally past the edge for a frame. A radius of slack is the
      // honest tolerance; drifting off-screen entirely would not pass.
      expect(s.x).toBeGreaterThan(-r)
      expect(s.x).toBeLessThan(bounds.width + r)
      expect(s.y).toBeGreaterThan(-r)
      expect(s.y).toBeLessThan(bounds.height + r)
    }
  })

  it('never produces a non-finite value', () => {
    const spheres = seedField(bounds, rng(17))
    const random = rng(23)
    for (let frame = 0; frame < 1_000; frame += 1) {
      step(spheres, bounds, IDLE, frame * 16, random)
    }
    for (const s of spheres) {
      for (const v of [s.x, s.y, s.vx, s.vy, s.hover]) {
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })

  it('keeps the field from settling — orbs are still moving after a long run', () => {
    const spheres = seedField(bounds, rng(19))
    const random = rng(29)
    for (let frame = 0; frame < 3_000; frame += 1) {
      step(spheres, bounds, IDLE, frame * 16, random)
    }
    const moving = spheres.filter((s) => Math.hypot(s.vx, s.vy) > SPEED_MIN / 2)
    expect(moving.length).toBe(spheres.length)
  })

  it('shrinks only the orb under the pointer', () => {
    const spheres = seedField(bounds, rng(31))
    const target = spheres[0]!
    const pointer = { x: target.x, y: target.y, active: true }
    for (let frame = 0; frame < 60; frame += 1) {
      // Pin the pointer to the orb so it cannot drift out from under it.
      pointer.x = target.x
      pointer.y = target.y
      step(spheres, bounds, pointer, frame * 16, rng(37))
    }
    expect(target.hover).toBeLessThan(0.95)
    const untouched = spheres.filter((s) => s !== target && s.hover > 0.99)
    expect(untouched.length).toBeGreaterThan(0)
  })

  it('does not move anything when the field is empty', () => {
    const spheres = seedField({ width: 0, height: 0 }, rng(41))
    expect(() => step(spheres, { width: 0, height: 0 }, IDLE, 0, rng(43))).not.toThrow()
  })
})
