/** One orb in the field. Mutated in place by `step` — the field is hot. */
export type Sphere = {
  x: number
  y: number
  vx: number
  vy: number
  /** Base radius. The *rendered* radius folds in breathing and hover. */
  r: number
  /** Mass, proportional to area. Bigger orbs shove smaller ones aside. */
  m: number
  /** This orb's own cruising speed, so the field never moves in lockstep. */
  speed: number
  /** Current hover scale, eased toward `hoverTarget`. */
  hover: number
  hoverTarget: number
  /** Breathing: phase offset, period in ms, and amplitude as a fraction. */
  phase: number
  period: number
  amplitude: number
  /** Every sixth orb runs warm, which is what gives the field two tiers. */
  warm: boolean
}

export type Bounds = { width: number; height: number }

export type Pointer = { x: number; y: number; active: boolean }
