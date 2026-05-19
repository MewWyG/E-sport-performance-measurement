import { DUAL_TASK_CONFIG } from '../constants'
import type { DualTaskConfig, MovementStage } from '../constants'
import type { Target } from '../types'
import type { Rng } from './rng'
import { randomFloat } from './rng'

type Waypoint = {
  x: number
  y: number
}

type MovementBounds = {
  centerX: number
  centerY: number
  halfWidth: number
  halfHeight: number
}

export function createInitialTarget(
  rng: Rng,
  config: DualTaskConfig = DUAL_TASK_CONFIG,
): Target {
  const firstStage = config.movementStages[0]
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  const waypoint = createWaypointInStage(
    rng,
    config,
    firstStage,
    config.targetRadius,
    centerX,
    centerY,
  )

  const dx = waypoint.x - config.canvasWidth / 2
  const dy = waypoint.y - config.canvasHeight / 2
  const distance = Math.max(Math.hypot(dx, dy), 0.001)

  const dirX = dx / distance
  const dirY = dy / distance

  return {
    x: config.canvasWidth / 2,
    y: config.canvasHeight / 2,

    vx: dirX * config.targetBaseSpeed,
    vy: dirY * config.targetBaseSpeed,

    radius: config.targetRadius,
    maxSpeed: config.targetMaxSpeed,

    phaseX: randomFloat(rng, 0, Math.PI * 2),
    phaseY: randomFloat(rng, 0, Math.PI * 2),

    waypointX: waypoint.x,
    waypointY: waypoint.y,
  }
}

type UpdateTargetParams = {
  target: Target
  deltaSec: number
  elapsedSec: number
  rng: Rng
  config?: DualTaskConfig
}

export function updateTargetPosition({
  target,
  deltaSec,
  elapsedSec,
  rng,
  config = DUAL_TASK_CONFIG,
}: UpdateTargetParams): Target {
  const stage = getMovementStage(elapsedSec, config.movementStages)

  let waypointX = target.waypointX
  let waypointY = target.waypointY

  const waypointIsValid = isPointInsideStage({
    x: waypointX,
    y: waypointY,
    config,
    stage,
    radius: target.radius,
  })

  const dxToWaypoint = waypointX - target.x
  const dyToWaypoint = waypointY - target.y
  const distanceToWaypoint = Math.hypot(dxToWaypoint, dyToWaypoint)

  const shouldPickNewWaypoint =
    !waypointIsValid || distanceToWaypoint <= getWaypointReachDistance(stage)

  if (shouldPickNewWaypoint) {
    const waypoint = createWaypointInStage(
      rng,
      config,
      stage,
      target.radius,
      target.x,
      target.y,
    )
    waypointX = waypoint.x
    waypointY = waypoint.y
  }

  const dx = waypointX - target.x
  const dy = waypointY - target.y
  const distance = Math.max(Math.hypot(dx, dy), 0.001)

  const dirX = dx / distance
  const dirY = dy / distance

  const stageMaxSpeed = target.maxSpeed * stage.speedMultiplier
  const desiredVx = dirX * stageMaxSpeed
  const desiredVy = dirY * stageMaxSpeed

  const steeringStrength = 3.8 * stage.directionChangeRate

  let vx =
    target.vx + (desiredVx - target.vx) * steeringStrength * deltaSec

  let vy =
    target.vy + (desiredVy - target.vy) * steeringStrength * deltaSec

  const noiseStrength = 38 * stage.accelerationMultiplier

  vx +=
    Math.sin(elapsedSec * 1.35 * stage.directionChangeRate + target.phaseX) *
    noiseStrength *
    deltaSec

  vy +=
    Math.cos(elapsedSec * 1.15 * stage.directionChangeRate + target.phaseY) *
    noiseStrength *
    deltaSec

  const currentSpeed = Math.hypot(vx, vy)

  if (currentSpeed > stageMaxSpeed) {
    const scale = stageMaxSpeed / currentSpeed
    vx *= scale
    vy *= scale
  }

  let x = target.x + vx * deltaSec
  let y = target.y + vy * deltaSec

  const canvasResult = constrainToCanvas({
    x,
    y,
    vx,
    vy,
    radius: target.radius,
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
  })

  x = canvasResult.x
  y = canvasResult.y
  vx = canvasResult.vx
  vy = canvasResult.vy

  const insideStageAfterMove = isPointInsideStage({
    x,
    y,
    config,
    stage,
    radius: target.radius,
  })

  if (!insideStageAfterMove) {
    const pulled = pullBackInsideStage({
      x,
      y,
      vx,
      vy,
      config,
      stage,
      radius: target.radius,
    })

    x = pulled.x
    y = pulled.y
    vx = pulled.vx
    vy = pulled.vy

    const waypoint = createWaypointInStage(
      rng,
      config,
      stage,
      target.radius,
      x,
      y,
    )
    waypointX = waypoint.x
    waypointY = waypoint.y
  }

  return {
    ...target,
    x,
    y,
    vx,
    vy,
    radius: config.targetRadius,
    maxSpeed: config.targetMaxSpeed,
    waypointX,
    waypointY,
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

function createWaypointInStage(
  rng: Rng,
  config: DualTaskConfig,
  stage: MovementStage,
  radius: number,
  currentX?: number,
  currentY?: number,
): Waypoint {
  const bounds = getMovementBounds(config, stage, radius)

  const stageScale = getStageScale(config, stage, radius)

  /**
   * ถ้า stage กว้างขึ้น ให้สุ่มออกจากโซนกลางมากขึ้น
   * เพื่อไม่ให้ target วนอยู่กลางสนามตลอด
   */
  const innerScale = stageScale < 0.35 ? 0 : 0.35

  const minX = bounds.centerX - bounds.halfWidth
  const maxX = bounds.centerX + bounds.halfWidth
  const minY = bounds.centerY - bounds.halfHeight
  const maxY = bounds.centerY + bounds.halfHeight

  const innerHalfWidth = bounds.halfWidth * innerScale
  const innerHalfHeight = bounds.halfHeight * innerScale

  const minTravelDistance = Math.max(
    40,
    Math.hypot(bounds.halfWidth, bounds.halfHeight) * 0.38,
  )

  let fallbackWaypoint: Waypoint = {
    x: bounds.centerX,
    y: bounds.centerY,
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const waypoint = {
      x: randomFloat(rng, minX, maxX),
      y: randomFloat(rng, minY, maxY),
    }

    fallbackWaypoint = waypoint

    const dxFromCenter = Math.abs(waypoint.x - bounds.centerX)
    const dyFromCenter = Math.abs(waypoint.y - bounds.centerY)

    const isOutsideInnerBox =
      dxFromCenter >= innerHalfWidth || dyFromCenter >= innerHalfHeight

    if (!isOutsideInnerBox) {
      continue
    }

    if (currentX === undefined || currentY === undefined) {
      return waypoint
    }

    const travelDistance = Math.hypot(
      waypoint.x - currentX,
      waypoint.y - currentY,
    )

    if (travelDistance >= minTravelDistance) {
      return waypoint
    }
  }

  return fallbackWaypoint
}

type IsPointInsideStageParams = {
  x: number
  y: number
  config: DualTaskConfig
  stage: MovementStage
  radius: number
}

function isPointInsideStage({
  x,
  y,
  config,
  stage,
  radius,
}: IsPointInsideStageParams): boolean {
  const bounds = getMovementBounds(config, stage, radius)

  return (
    x >= bounds.centerX - bounds.halfWidth &&
    x <= bounds.centerX + bounds.halfWidth &&
    y >= bounds.centerY - bounds.halfHeight &&
    y <= bounds.centerY + bounds.halfHeight
  )
}

function getAllowedMovementRadius(
  config: DualTaskConfig,
  stage: MovementStage,
  radius: number,
): number {
  const maxCanvasRadius = Math.min(config.canvasWidth, config.canvasHeight) / 2 - radius

  return Math.max(8, Math.min(stage.movementRadius, maxCanvasRadius))
}

function getStageScale(
  config: DualTaskConfig,
  stage: MovementStage,
  radius: number,
): number {
  const maxCircleRadius =
    Math.min(config.canvasWidth, config.canvasHeight) / 2 - radius

  return Math.min(1, stage.movementRadius / maxCircleRadius)
}

function getMovementBounds(
  config: DualTaskConfig,
  stage: MovementStage,
  radius: number,
): MovementBounds {
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  const maxHalfWidth = config.canvasWidth / 2 - radius
  const maxHalfHeight = config.canvasHeight / 2 - radius

  const scale = getStageScale(config, stage, radius)

  return {
    centerX,
    centerY,
    halfWidth: Math.max(20, maxHalfWidth * scale),
    halfHeight: Math.max(20, maxHalfHeight * scale),
  }
}

function getWaypointReachDistance(stage: MovementStage): number {
  /**
   * stage เล็กมากไม่ควรต้องเข้าใกล้ waypoint จนเกินไป
   * ไม่งั้น target จะสั่นแถวจุดหมาย
   */
  return Math.max(18, Math.min(46, stage.movementRadius * 0.22))
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
    vx *= -0.45
    x = clamp(x, radius, canvasWidth - radius)
  }

  if (y - radius <= 0 || y + radius >= canvasHeight) {
    vy *= -0.45
    y = clamp(y, radius, canvasHeight - radius)
  }

  return { x, y, vx, vy }
}

type PullBackInsideStageParams = {
  x: number
  y: number
  vx: number
  vy: number
  config: DualTaskConfig
  stage: MovementStage
  radius: number
}

function pullBackInsideStage({
  x,
  y,
  vx,
  vy,
  config,
  stage,
  radius,
}: PullBackInsideStageParams) {
  const bounds = getMovementBounds(config, stage, radius)

  const minX = bounds.centerX - bounds.halfWidth
  const maxX = bounds.centerX + bounds.halfWidth
  const minY = bounds.centerY - bounds.halfHeight
  const maxY = bounds.centerY + bounds.halfHeight

  const nextX = clamp(x, minX, maxX)
  const nextY = clamp(y, minY, maxY)

  if (nextX !== x) {
    vx *= -0.15
  }

  if (nextY !== y) {
    vy *= -0.15
  }

  return {
    x: nextX,
    y: nextY,
    vx,
    vy,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}