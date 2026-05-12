import { DUAL_TASK_CONFIG } from '../constants'
import type { DualTaskConfig, MovementStage } from '../constants'
import type { Target } from '../types'
import type { Rng } from './rng'
import { randomFloat } from './rng'

type Waypoint = {
  x: number
  y: number
}

export function createInitialTarget(
  rng: Rng,
  config: DualTaskConfig = DUAL_TASK_CONFIG,
): Target {
  const firstStage = config.movementStages[0]
  const waypoint = createWaypointInStage(
    rng,
    config,
    firstStage,
    config.targetRadius,
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
    const waypoint = createWaypointInStage(rng, config, stage, target.radius)
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

    const waypoint = createWaypointInStage(rng, config, stage, target.radius)
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
): Waypoint {
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  const allowedRadius = getAllowedMovementRadius(config, stage, radius)

  const angle = randomFloat(rng, 0, Math.PI * 2)

  /**
   * ใช้ sqrt เพื่อให้ waypoint กระจายค่อนข้างสม่ำเสมอในพื้นที่วงกลม
   * ถ้าไม่ใช้ sqrt จุดจะไปกองใกล้กลางมากเกินไป
   */
  const distance = Math.sqrt(randomFloat(rng, 0, 1)) * allowedRadius

  return {
    x: centerX + Math.cos(angle) * distance,
    y: centerY + Math.sin(angle) * distance,
  }
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
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  const allowedRadius = getAllowedMovementRadius(config, stage, radius)

  const dx = x - centerX
  const dy = y - centerY

  return Math.hypot(dx, dy) <= allowedRadius
}

function getAllowedMovementRadius(
  config: DualTaskConfig,
  stage: MovementStage,
  radius: number,
): number {
  const maxCanvasRadius = Math.min(config.canvasWidth, config.canvasHeight) / 2 - radius

  return Math.max(8, Math.min(stage.movementRadius, maxCanvasRadius))
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
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  const allowedRadius = getAllowedMovementRadius(config, stage, radius)

  const dx = x - centerX
  const dy = y - centerY
  const distance = Math.max(Math.hypot(dx, dy), 0.001)

  const normalX = dx / distance
  const normalY = dy / distance

  /**
   * แทนที่จะเด้งกลับแบบแข็ง ๆ
   * เรา clamp ตำแหน่งกลับเข้าขอบเขต แล้วตัด velocity ที่พุ่งออกด้านนอกออก
   */
  const safeRadius = allowedRadius * 0.96

  const nextX = centerX + normalX * safeRadius
  const nextY = centerY + normalY * safeRadius

  const velocityDotNormal = vx * normalX + vy * normalY

  if (velocityDotNormal > 0) {
    vx -= velocityDotNormal * normalX
    vy -= velocityDotNormal * normalY
  }

  const tangentX = -normalY
  const tangentY = normalX
  const tangentSpeed = vx * tangentX + vy * tangentY

  vx = tangentX * tangentSpeed
  vy = tangentY * tangentSpeed

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