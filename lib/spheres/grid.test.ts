import { describe, expect, it } from 'vitest'
import { candidatePairs } from './grid'
import { renderedRadius } from './geometry'
import { seedField } from './field'
import type { Sphere } from './types'

function orb(x: number, y: number, r: number): Sphere {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    r,
    m: r * r,
    speed: 0.2,
    hover: 1,
    hoverTarget: 1,
    phase: 0,
    period: 10_000,
    amplitude: 0,
    warm: false,
  }
}

/** A seeded LCG, so a failure is reproducible rather than a one-off. */
function rng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

const radiusOf = (s: Sphere) => renderedRadius(s, 0)

/** Every genuinely touching pair, found the slow, obviously-correct way. */
function touchingByBruteForce(spheres: readonly Sphere[]): Set<string> {
  const found = new Set<string>()
  for (let i = 0; i < spheres.length; i += 1) {
    for (let j = i + 1; j < spheres.length; j += 1) {
      const a = spheres[i]!
      const b = spheres[j]!
      if (Math.hypot(b.x - a.x, b.y - a.y) < radiusOf(a) + radiusOf(b)) {
        found.add(`${i}|${j}`)
      }
    }
  }
  return found
}

function keyed(spheres: readonly Sphere[], pairs: ReadonlyArray<readonly [Sphere, Sphere]>) {
  const index = new Map<Sphere, number>()
  spheres.forEach((s, i) => index.set(s, i))
  return pairs.map(([a, b]) => {
    const i = index.get(a)!
    const j = index.get(b)!
    return i < j ? `${i}|${j}` : `${j}|${i}`
  })
}

describe('candidatePairs', () => {
  it('returns nothing for an empty or single-orb field', () => {
    expect(candidatePairs([], radiusOf)).toEqual([])
    expect(candidatePairs([orb(0, 0, 10)], radiusOf)).toEqual([])
  })

  it('never reports the same pair twice', () => {
    const spheres = seedField({ width: 1440, height: 900 }, rng(7))
    const keys = keyed(spheres, candidatePairs(spheres, radiusOf))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('never pairs an orb with itself', () => {
    const spheres = seedField({ width: 1440, height: 900 }, rng(11))
    for (const [a, b] of candidatePairs(spheres, radiusOf)) {
      expect(a).not.toBe(b)
    }
  })

  // The one that matters: a broadphase that misses contacts is worse than no
  // broadphase, because the bug only shows as orbs occasionally passing through
  // each other — which reads as a rendering glitch, not a physics one.
  it('is a superset of every touching pair, across many seeds and densities', () => {
    const viewports = [
      { width: 480, height: 800 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 2560, height: 1440 },
    ]
    for (const bounds of viewports) {
      for (let seed = 1; seed <= 25; seed += 1) {
        const spheres = seedField(bounds, rng(seed * 977))
        const reported = new Set(keyed(spheres, candidatePairs(spheres, radiusOf)))
        for (const key of touchingByBruteForce(spheres)) {
          expect(reported.has(key), `missed ${key} at ${bounds.width}x${bounds.height} seed ${seed}`).toBe(true)
        }
      }
    }
  })

  it('finds a touching pair that straddles a cell boundary', () => {
    // Cell size is 2 x largest radius = 100, so these sit either side of x=100
    // and must still be reported.
    const a = orb(96, 50, 50)
    const b = orb(140, 50, 50)
    const keys = keyed([a, b], candidatePairs([a, b], radiusOf))
    expect(keys).toContain('0|1')
  })

  it('finds a touching pair that straddles a diagonal cell boundary', () => {
    const a = orb(95, 95, 50)
    const b = orb(130, 130, 50)
    const keys = keyed([a, b], candidatePairs([a, b], radiusOf))
    expect(keys).toContain('0|1')
  })

  it('handles negative coordinates without dropping pairs', () => {
    const a = orb(-140, -140, 50)
    const b = orb(-100, -100, 50)
    const keys = keyed([a, b], candidatePairs([a, b], radiusOf))
    expect(keys).toContain('0|1')
  })

  it('is cheaper than the full sweep on a realistic field', () => {
    const spheres = seedField({ width: 1440, height: 900 }, rng(3))
    const full = (spheres.length * (spheres.length - 1)) / 2
    expect(candidatePairs(spheres, radiusOf).length).toBeLessThan(full)
  })
})
