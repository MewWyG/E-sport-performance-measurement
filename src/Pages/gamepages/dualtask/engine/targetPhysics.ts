import { DUAL_TASK_CONFIG } from '../constants'
import type { DualTaskConfig, MovementStage } from '../constants'
import type { Target } from '../types'
import type { Rng } from './rng'
import { randomFloat } from './rng'

export function createInitialTarget(
  rng: Rng,
  config: DualTaskConfig = DUAL_TASK_CONFIG,
): Target {
  const angle = randomFloat(rng, 0, Math.PI * 2)

  return {
    x: config.canvasWidth / 2,
    y: config.canvasHeight / 2,
    vx: Math.cos(angle) * config.targetBaseSpeed,
    vy: Math.sin(angle) * config.targetBaseSpeed,
    radius: config.targetRadius,
    maxSpeed: config.targetMaxSpeed,
    phaseX: randomFloat(rng, 0, Math.PI * 2),
    phaseY: randomFloat(rng, 0, Math.PI * 2),
  }
}

type UpdateTargetParams = {
  target: Target
  deltaSec: number
  elapsedSec: number
  config?: DualTaskConfig
}

export function updateTargetPosition({
  target,
  deltaSec,
  elapsedSec,
  config = DUAL_TASK_CONFIG,
}: UpdateTargetParams): Target {
  const stage = getMovementStage(elapsedSec, config.movementStages)

  const accelerationStrength = 85 * stage.accelerationMultiplier
  const xFrequency = 1.35 * stage.directionChangeRate
  const yFrequency = 1.15 * stage.directionChangeRate

  let vx =
    target.vx +
    Math.sin(elapsedSec * xFrequency + target.phaseX) *
      accelerationStrength *
      deltaSec

  let vy =
    target.vy +
    Math.cos(elapsedSec * yFrequency + target.phaseY) *
      accelerationStrength *
      deltaSec

  const maxSpeed = target.maxSpeed * stage.speedMultiplier
  const currentSpeed = Math.hypot(vx, vy)

  if (currentSpeed > maxSpeed) {
    const scale = maxSpeed / currentSpeed
    vx *= scale
    vy *= scale
  }

  let x = target.x + vx * deltaSec
  let y = target.y + vy * deltaSec

  const canvasBoundsResult = constrainToCanvas({
    x,
    y,
    vx,
    vy,
    radius: target.radius,
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
  })

  x = canvasBoundsResult.x
  y = canvasBoundsResult.y
  vx = canvasBoundsResult.vx
  vy = canvasBoundsResult.vy

  const movementBoundsResult = constrainToMovementStage({
    x,
    y,
    vx,
    vy,
    radius: target.radius,
    stage,
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
  })

  x = movementBoundsResult.x
  y = movementBoundsResult.y
  vx = movementBoundsResult.vx
  vy = movementBoundsResult.vy

  return {
    ...target,
    x,
    y,
    vx,
    vy,
    radius: config.targetRadius,
    maxSpeed: config.targetMaxSpeed,
  }
}

function getMovementStage(
  elapsedSec: number,
  stages: readonly MovementStage[],
): MovementStage {
  return (
    stages.find(
      (stage) => elapsedSec >= stage.startSec && elapsedSec < stage.endSec,
    ) ?? stages[stages.length - 1]
  )
}

type CanvasBoundsParams = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  canvasWidth: number
  canvasHeight: number
}

function constrainToCanvas({
  x,
  y,
  vx,
  vy,
  radius,
  canvasWidth,
  canvasHeight,
}: CanvasBoundsParams) {
  if (x - radius <= 0 || x + radius >= canvasWidth) {
    vx *= -1
    x = clamp(x, radius, canvasWidth - radius)
  }

  if (y - radius <= 0 || y + radius >= canvasHeight) {
    vy *= -1
    y = clamp(y, radius, canvasHeight - radius)
  }

  return { x, y, vx, vy }
}

type MovementStageBoundsParams = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  stage: MovementStage
  canvasWidth: number
  canvasHeight: number
}

function constrainToMovementStage({
  x,
  y,
  vx,
  vy,
  radius,
  stage,
  canvasWidth,
  canvasHeight,
}: MovementStageBoundsParams) {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  const maxCanvasRadius =
    Math.min(canvasWidth, canvasHeight) / 2 - radius

  const allowedRadius = Math.min(stage.movementRadius, maxCanvasRadius)

  const dxFromCenter = x - centerX
  const dyFromCenter = y - centerY
  const distanceFromCenter = Math.hypot(dxFromCenter, dyFromCenter)

  if (distanceFromCenter <= allowedRadius) {
    return { x, y, vx, vy }
  }

  const normalX = dxFromCenter / distanceFromCenter
  const normalY = dyFromCenter / distanceFromCenter

  x = centerX + normalX * allowedRadius
  y = centerY + normalY * allowedRadius

  const velocityDotNormal = vx * normalX + vy * normalY

  if (velocityDotNormal > 0) {
    vx -= 2 * velocityDotNormal * normalX
    vy -= 2 * velocityDotNormal * normalY
  }

  return { x, y, vx, vy }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}