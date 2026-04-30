import type { Bounds, MovingTarget } from '../types'
import { randomBetween } from '../utils/random'

export function updateTargets(
  targets: MovingTarget[],
  deltaMs: number,
  now: number,
  bounds: Bounds,
): MovingTarget[] {
  return targets.map((target) => {
    let { x, y, vx, vy, nextTurnAt } = target

    if (target.pattern === 'random' && now >= nextTurnAt) {
      const speed = Math.max(Math.hypot(vx, vy), 0.08)
      const angle = Math.random() * Math.PI * 2

      vx = Math.cos(angle) * speed
      vy = Math.sin(angle) * speed
      nextTurnAt = now + randomBetween(380, 700)
    }

    x += vx * deltaMs
    y += vy * deltaMs

    const halfSize = target.size / 2

    if (x <= halfSize) {
      x = halfSize
      vx = Math.abs(vx)
    }

    if (x >= bounds.width - halfSize) {
      x = bounds.width - halfSize
      vx = -Math.abs(vx)
    }

    if (y <= halfSize) {
      y = halfSize
      vy = Math.abs(vy)
    }

    if (y >= bounds.height - halfSize) {
      y = bounds.height - halfSize
      vy = -Math.abs(vy)
    }

    return {
      ...target,
      x,
      y,
      vx,
      vy,
      nextTurnAt,
    }
  })
}