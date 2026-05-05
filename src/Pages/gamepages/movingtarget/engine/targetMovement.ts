import type { Bounds, MovingTarget } from '../types'
import { randomBetween } from '../utils/random'
import {
  getStopButtonSafeRect,
  resolveCircleRectCollision,
} from './playAreaObstacles'
import { separateOverlappingTargets } from './targetSeparation'

export function updateTargets(
  targets: MovingTarget[],
  deltaMs: number,
  now: number,
  bounds: Bounds,
): MovingTarget[] {
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

  const movedTargets = targets.map((target) => {
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

    const resolved = resolveCircleRectCollision({
      x,
      y,
      radius: halfSize,
      vx,
      vy,
      rect: stopButtonSafeRect,
    })

    return {
      ...target,
      x: clamp(resolved.x, halfSize, bounds.width - halfSize),
      y: clamp(resolved.y, halfSize, bounds.height - halfSize),
      vx: resolved.vx,
      vy: resolved.vy,
      nextTurnAt,
    }
  })

  return separateOverlappingTargets(movedTargets, bounds)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}