import { DUAL_TASK_CONFIG } from '../constants'
import type { Target } from '../types'
import type { Rng } from './rng'
import { randomFloat } from './rng'

export function createInitialTarget(rng: Rng): Target {
  const angle = randomFloat(rng, 0, Math.PI * 2)

  return {
    x: DUAL_TASK_CONFIG.canvasWidth / 2,
    y: DUAL_TASK_CONFIG.canvasHeight / 2,
    vx: Math.cos(angle) * DUAL_TASK_CONFIG.targetBaseSpeed,
    vy: Math.sin(angle) * DUAL_TASK_CONFIG.targetBaseSpeed,
    radius: DUAL_TASK_CONFIG.targetRadius,
    maxSpeed: DUAL_TASK_CONFIG.targetMaxSpeed,
    phaseX: randomFloat(rng, 0, Math.PI * 2),
    phaseY: randomFloat(rng, 0, Math.PI * 2),
  }
}

type UpdateTargetParams = {
  target: Target
  deltaSec: number
  elapsedSec: number
}

export function updateTargetPosition({
  target,
  deltaSec,
  elapsedSec,
}: UpdateTargetParams): Target {
  const accelerationStrength = 85

  let vx =
    target.vx +
    Math.sin(elapsedSec * 1.35 + target.phaseX) * accelerationStrength * deltaSec

  let vy =
    target.vy +
    Math.cos(elapsedSec * 1.15 + target.phaseY) * accelerationStrength * deltaSec

  const currentSpeed = Math.hypot(vx, vy)

  if (currentSpeed > target.maxSpeed) {
    const scale = target.maxSpeed / currentSpeed
    vx *= scale
    vy *= scale
  }

  let x = target.x + vx * deltaSec
  let y = target.y + vy * deltaSec

  if (
    x - target.radius <= 0 ||
    x + target.radius >= DUAL_TASK_CONFIG.canvasWidth
  ) {
    vx *= -1
    x = Math.max(
      target.radius,
      Math.min(DUAL_TASK_CONFIG.canvasWidth - target.radius, x),
    )
  }

  if (
    y - target.radius <= 0 ||
    y + target.radius >= DUAL_TASK_CONFIG.canvasHeight
  ) {
    vy *= -1
    y = Math.max(
      target.radius,
      Math.min(DUAL_TASK_CONFIG.canvasHeight - target.radius, y),
    )
  }

  return {
    ...target,
    x,
    y,
    vx,
    vy,
  }
}