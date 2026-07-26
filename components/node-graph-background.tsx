'use client'

import { useEffect, useRef } from 'react'

type GraphNode = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hub: boolean
  reach: number
}

const AREA_PER_NODE = 11_500
const MIN_NODES = 30
const MAX_NODES = 150
/** Roughly one node in six is a hub. */
const HUB_EVERY = 6
const LEAF_REACH = 122
const HUB_REACH = 168
const POINTER_RADIUS = 190
const MAX_DPR = 1.5
const DRIFT = 0.055

/**
 * Drifting node graph — reads as both a distributed system and a neural net.
 *
 * Two tiers, not a uniform scatter: a minority of hubs with a wide connection
 * radius, and leaves that only reach their close neighbours. That is what makes
 * it look like a topology — uniform nodes at uniform spacing read as noise
 * however many of them you draw.
 *
 * Deliberately 2D canvas rather than WebGL: a fraction of the cost, no GPU
 * drain over a long visit. Renders a single static frame below `md` and under
 * `prefers-reduced-motion`, and stops the loop entirely when the tab is hidden.
 * Colours are read from CSS custom properties so theme switches just work.
 */
export function NodeGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const smallScreen = window.matchMedia('(max-width: 767px)')

    let nodes: GraphNode[] = []
    let width = 0
    let height = 0
    let frame = 0
    let animated = false

    const pointer = { x: 0, y: 0, active: false }
    const palette = {
      node: '138 145 153',
      edge: '110 118 127',
      accent: '240 164 74',
      nodeAlpha: 0.75,
      edgeAlpha: 0.5,
    }

    const readPalette = () => {
      const styles = getComputedStyle(canvas)
      const read = (name: string, fallback: string) =>
        styles.getPropertyValue(name).trim() || fallback
      palette.node = read('--graph-node-rgb', palette.node)
      palette.edge = read('--graph-edge-rgb', palette.edge)
      palette.accent = read('--graph-accent-rgb', palette.accent)
      palette.nodeAlpha = Number(read('--graph-node-alpha', '0.75'))
      palette.edgeAlpha = Number(read('--graph-edge-alpha', '0.5'))
    }

    const seed = () => {
      const count = Math.min(
        MAX_NODES,
        Math.max(MIN_NODES, Math.round((width * height) / AREA_PER_NODE)),
      )
      nodes = Array.from({ length: count }, (_, index) => {
        const angle = Math.random() * Math.PI * 2
        const hub = index % HUB_EVERY === 0
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * DRIFT,
          vy: Math.sin(angle) * DRIFT,
          r: hub ? 2.3 + Math.random() : 1 + Math.random() * 0.9,
          hub,
          reach: hub ? HUB_REACH : LEAF_REACH,
        }
      })
    }

    const step = () => {
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        if (node.x <= 0) {
          node.x = 0
          node.vx = Math.abs(node.vx)
        } else if (node.x >= width) {
          node.x = width
          node.vx = -Math.abs(node.vx)
        }
        if (node.y <= 0) {
          node.y = 0
          node.vy = Math.abs(node.vy)
        } else if (node.y >= height) {
          node.y = height
          node.vy = -Math.abs(node.vy)
        }

        if (pointer.active) {
          const dx = node.x - pointer.x
          const dy = node.y - pointer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 0.01 && distance < POINTER_RADIUS) {
            const push = (1 - distance / POINTER_RADIUS) * 0.09
            node.vx += (dx / distance) * push
            node.vy += (dy / distance) * push
          }
        }

        // Bleed off any pointer energy so the field always settles back to a
        // slow drift instead of accelerating away.
        if (Math.hypot(node.vx, node.vy) > DRIFT * 4) {
          node.vx *= 0.95
          node.vy *= 0.95
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i]
        if (!a) continue

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j]
          if (!b) continue

          // A pair connects if *either* end reaches that far, so hubs gather
          // spokes while leaf-to-leaf links stay local.
          const range = a.reach > b.reach ? a.reach : b.reach
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance > range) continue

          const strength = 1 - distance / range
          let channels = palette.edge
          let alpha = strength * palette.edgeAlpha * (a.hub || b.hub ? 1 : 0.62)

          if (pointer.active) {
            const proximity =
              1 -
              Math.min(
                1,
                Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y) /
                  POINTER_RADIUS,
              )
            if (proximity > 0) {
              channels = palette.accent
              alpha = strength * (palette.edgeAlpha + proximity * 0.5)
            }
          }

          ctx.strokeStyle = `rgb(${channels} / ${alpha})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // Batched fill passes rather than per-node style changes: leaves dim,
      // hubs bright enough to read as the structure the edges hang off.
      ctx.fillStyle = `rgb(${palette.node} / ${palette.nodeAlpha * 0.85})`
      for (const node of nodes) {
        if (node.hub) continue
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = `rgb(${palette.node} / ${palette.nodeAlpha})`
      for (const node of nodes) {
        if (!node.hub) continue
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.strokeStyle = `rgb(${palette.node} / ${palette.nodeAlpha * 0.34})`
      for (const node of nodes) {
        if (!node.hub) continue
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r + 3.4, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const tick = () => {
      step()
      draw()
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (frame) return
      frame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (width === 0 || height === 0) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineWidth = 1
      seed()
      draw()
    }

    const applyMode = () => {
      animated = !reduceMotion.matches && !smallScreen.matches
      stop()
      if (animated) {
        if (!document.hidden) start()
      } else {
        pointer.active = false
        draw()
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else if (animated) start()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!animated) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    readPalette()
    resize()
    applyMode()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    // next-themes flips a class on <html>; re-read the palette when it does.
    const themeObserver = new MutationObserver(() => {
      readPalette()
      if (!animated) draw()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    reduceMotion.addEventListener('change', applyMode)
    smallScreen.addEventListener('change', applyMode)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)

    return () => {
      stop()
      resizeObserver.disconnect()
      themeObserver.disconnect()
      reduceMotion.removeEventListener('change', applyMode)
      smallScreen.removeEventListener('change', applyMode)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="size-full" />
      {/* Keeps the graph from competing with body copy. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_38%,var(--color-canvas)_96%)]" />
    </div>
  )
}
