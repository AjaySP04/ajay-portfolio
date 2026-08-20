import type { Sphere } from './types'

/**
 * Uniform spatial hash for broadphase pair-finding.
 *
 * Unlike the node graph this replaces, the field has to *resolve* every pair
 * each frame rather than just draw the close ones, so the cost of the naive
 * O(n²) sweep is paid on physics as well as paint. Cell size is twice the
 * largest rendered radius, which guarantees any touching pair lands in the same
 * or an adjacent cell — so scanning a 3×3 neighbourhood is exhaustive.
 *
 * Only forward neighbours are visited (the four cells after the current one in
 * scan order, plus the cell itself), which is what stops every pair being
 * reported twice.
 */
const FORWARD: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

export type Pair = readonly [Sphere, Sphere]

export function candidatePairs(
  spheres: readonly Sphere[],
  radiusOf: (s: Sphere) => number,
): Pair[] {
  if (spheres.length < 2) return []

  let largest = 0
  for (const s of spheres) {
    const r = radiusOf(s)
    if (r > largest) largest = r
  }

  const cell = Math.max(1, largest * 2)
  const buckets = new Map<string, Sphere[]>()
  const keyOf = (cx: number, cy: number) => `${cx}:${cy}`

  for (const s of spheres) {
    const key = keyOf(Math.floor(s.x / cell), Math.floor(s.y / cell))
    const bucket = buckets.get(key)
    if (bucket) bucket.push(s)
    else buckets.set(key, [s])
  }

  const pairs: Pair[] = []

  for (const [key, bucket] of buckets) {
    const [cxRaw, cyRaw] = key.split(':')
    const cx = Number(cxRaw)
    const cy = Number(cyRaw)

    for (const [dx, dy] of FORWARD) {
      const other = dx === 0 && dy === 0 ? bucket : buckets.get(keyOf(cx + dx, cy + dy))
      if (!other) continue

      if (other === bucket) {
        // Same cell: every unordered pair within it, once.
        for (let i = 0; i < bucket.length; i += 1) {
          for (let j = i + 1; j < bucket.length; j += 1) {
            pairs.push([bucket[i]!, bucket[j]!])
          }
        }
      } else {
        for (const a of bucket) for (const b of other) pairs.push([a, b])
      }
    }
  }

  return pairs
}
