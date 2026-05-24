import {
  TARGET_COLLISION_GAP,
  TARGET_COLLISION_RESOLVE_PASSES,
  TARGET_SEPARATION_EPSILON,
  TARGET_SEPARATION_FALLBACK_ANGLE_I_DEG,
  TARGET_SEPARATION_FALLBACK_ANGLE_J_DEG,
  TARGET_SEPARATION_MIN_SPEED,
} from '../config'
import type { Bounds, MovingTarget } from '../types'
import {
  getStopButtonSafeRect,
  resolveCircleRectCollision,
} from './playAreaObstacles'

// แก้ปัญหาเป้าหมายซ้อนกันโดยแยกเป้าให้พ้นระยะกัน
export function separateOverlappingTargets(
  targets: MovingTarget[],
  bounds: Bounds,
): MovingTarget[] {
  let resolvedTargets = targets.map((target) => ({ ...target }))

  for (let pass = 0; pass < TARGET_COLLISION_RESOLVE_PASSES; pass += 1) {
    resolvedTargets = resolveOnePass(resolvedTargets, bounds)
  }

  return resolvedTargets
}

function resolveOnePass(targets: MovingTarget[], bounds: Bounds) {
  const nextTargets = targets.map((target) => ({ ...target }))

  for (let i = 0; i < nextTargets.length; i += 1) {
    for (let j = i + 1; j < nextTargets.length; j += 1) {
      const first = nextTargets[i]
      const second = nextTargets[j]

      const dx = second.x - first.x
      const dy = second.y - first.y
      const distance = Math.hypot(dx, dy)

      const minDistance =
        first.size / 2 + second.size / 2 + TARGET_COLLISION_GAP

      if (distance >= minDistance) {
        continue
      }

      const direction = getSafeDirection(dx, dy, i, j)
      const overlap = minDistance - Math.max(distance, TARGET_SEPARATION_EPSILON)

      if (first.isCorrect && !second.isCorrect) {
        nextTargets[j] = pushTargetAway({
          target: second,
          directionX: direction.x,
          directionY: direction.y,
          distance: overlap,
          bounds,
        })

        continue
      }

      if (!first.isCorrect && second.isCorrect) {
        nextTargets[i] = pushTargetAway({
          target: first,
          directionX: -direction.x,
          directionY: -direction.y,
          distance: overlap,
          bounds,
        })

        continue
      }

      if (!first.isCorrect && !second.isCorrect) {
        nextTargets[i] = pushTargetAway({
          target: first,
          directionX: -direction.x,
          directionY: -direction.y,
          distance: overlap / 2,
          bounds,
        })

        nextTargets[j] = pushTargetAway({
          target: second,
          directionX: direction.x,
          directionY: direction.y,
          distance: overlap / 2,
          bounds,
        })
      }
    }
  }

  return nextTargets
}

type PushTargetAwayParams = {
  target: MovingTarget
  directionX: number
  directionY: number
  distance: number
  bounds: Bounds
}

function pushTargetAway({
  target,
  directionX,
  directionY,
  distance,
  bounds,
}: PushTargetAwayParams): MovingTarget {
  const halfSize = target.size / 2

  let x = target.x + directionX * distance
  let y = target.y + directionY * distance

  x = clamp(x, halfSize, bounds.width - halfSize)
  y = clamp(y, halfSize, bounds.height - halfSize)

  const speed = Math.max(
    Math.hypot(target.vx, target.vy),
    TARGET_SEPARATION_MIN_SPEED,
  )

  let vx = directionX * speed
  let vy = directionY * speed

  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

  const resolved = resolveCircleRectCollision({
    x,
    y,
    radius: halfSize,
    vx,
    vy,
    rect: stopButtonSafeRect,
  })

  x = clamp(resolved.x, halfSize, bounds.width - halfSize)
  y = clamp(resolved.y, halfSize, bounds.height - halfSize)
  vx = resolved.vx
  vy = resolved.vy

  return {
    ...target,
    x,
    y,
    vx,
    vy,
  }
}

function getSafeDirection(dx: number, dy: number, i: number, j: number) {
  const distance = Math.hypot(dx, dy)

  if (distance > TARGET_SEPARATION_EPSILON) {
    return {
      x: dx / distance,
      y: dy / distance,
    }
  }

  const angle =
    ((i + 1) * TARGET_SEPARATION_FALLBACK_ANGLE_I_DEG +
      (j + 1) * TARGET_SEPARATION_FALLBACK_ANGLE_J_DEG) *
    (Math.PI / 180)

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}