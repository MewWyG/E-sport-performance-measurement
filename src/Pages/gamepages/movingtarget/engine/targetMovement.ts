import {
  TARGET_MAX_MOVEMENT_STEP_PX,
  TARGET_MIN_DIRECTION_SPEED,
  TARGET_MOVEMENT_MAX_GUARD_STEPS,
} from '../config'
import type { Bounds, MovingTarget } from '../types'
import {
  getStopButtonSafeRect,
  resolveCircleRectCollision,
} from './playAreaObstacles'
import { separateOverlappingTargets } from './targetSeparation'

// คำนวณตำแหน่งของทุกเป้าในแต่ละเฟรม และจัดการการชนกับปุ่มหยุดเกม
export function updateTargets(
  targets: MovingTarget[],
  deltaMs: number,
  _now: number,
  bounds: Bounds,
): MovingTarget[] {
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

  const movedTargets = targets.map((target) =>
    moveTargetUntilDistanceComplete(
      target,
      deltaMs,
      bounds,
      stopButtonSafeRect,
    ),
  )

  return separateOverlappingTargets(movedTargets, bounds)
}

// เคลื่อนที่เป้าจนหมดระยะที่ตั้งไว้ พร้อมจัดการการชนกับขอบและพื้นที่ปุ่มหยุด
function moveTargetUntilDistanceComplete(
  target: MovingTarget,
  deltaMs: number,
  bounds: Bounds,
  stopButtonSafeRect: ReturnType<typeof getStopButtonSafeRect>,
): MovingTarget {
  if (
    target.hasCompletedMovement ||
    target.remainingMoveDistance <= TARGET_MIN_DIRECTION_SPEED
  ) {
    return {
      ...target,
      vx: 0,
      vy: 0,
      remainingMoveDistance: 0,
      hasCompletedMovement: true,
    }
  }

  const speed = Math.max(
    Math.hypot(target.vx, target.vy),
    TARGET_MIN_DIRECTION_SPEED,
  )

  let directionX = target.vx / speed
  let directionY = target.vy / speed

  let x = target.x
  let y = target.y

  let remainingFrameDistance = speed * deltaMs
  let remainingMoveDistance = target.remainingMoveDistance

  const halfSize = target.size / 2

  let guard = 0

  while (
    remainingFrameDistance > TARGET_MIN_DIRECTION_SPEED &&
    guard < TARGET_MOVEMENT_MAX_GUARD_STEPS
  ) {
    guard += 1

    if (remainingMoveDistance <= TARGET_MIN_DIRECTION_SPEED) {
      remainingMoveDistance = 0
      break
    }

    const stepDistance = Math.min(
      remainingFrameDistance,
      remainingMoveDistance,
      TARGET_MAX_MOVEMENT_STEP_PX,
    )

    x += directionX * stepDistance
    y += directionY * stepDistance

    const boundaryResolved = resolveBoundaryCollision({
      x,
      y,
      directionX,
      directionY,
      halfSize,
      bounds,
    })

    x = boundaryResolved.x
    y = boundaryResolved.y
    directionX = boundaryResolved.directionX
    directionY = boundaryResolved.directionY

    const rectResolved = resolveCircleRectCollision({
      x,
      y,
      radius: halfSize,
      vx: directionX * speed,
      vy: directionY * speed,
      rect: stopButtonSafeRect,
    })

    x = clamp(rectResolved.x, halfSize, bounds.width - halfSize)
    y = clamp(rectResolved.y, halfSize, bounds.height - halfSize)

    const rectSpeed = Math.max(
      Math.hypot(rectResolved.vx, rectResolved.vy),
      TARGET_MIN_DIRECTION_SPEED,
    )

    directionX = rectResolved.vx / rectSpeed
    directionY = rectResolved.vy / rectSpeed

    remainingFrameDistance -= stepDistance
    remainingMoveDistance -= stepDistance
  }

  if (remainingMoveDistance <= TARGET_MIN_DIRECTION_SPEED) {
    return {
      ...target,
      x,
      y,
      vx: 0,
      vy: 0,
      remainingMoveDistance: 0,
      hasCompletedMovement: true,
    }
  }

  return {
    ...target,
    x,
    y,
    vx: directionX * speed,
    vy: directionY * speed,
    remainingMoveDistance,
    hasCompletedMovement: false,
  }
}

type ResolveBoundaryCollisionParams = {
  x: number
  y: number
  directionX: number
  directionY: number
  halfSize: number
  bounds: Bounds
}

// ตรวจสอบการชนขอบสนามและสะท้อนทิศทางเป้าเมื่อชนขอบ
function resolveBoundaryCollision({
  x,
  y,
  directionX,
  directionY,
  halfSize,
  bounds,
}: ResolveBoundaryCollisionParams) {
  if (x <= halfSize) {
    x = halfSize
    directionX = Math.abs(directionX)
  }

  if (x >= bounds.width - halfSize) {
    x = bounds.width - halfSize
    directionX = -Math.abs(directionX)
  }

  if (y <= halfSize) {
    y = halfSize
    directionY = Math.abs(directionY)
  }

  if (y >= bounds.height - halfSize) {
    y = bounds.height - halfSize
    directionY = -Math.abs(directionY)
  }

  const directionLength = Math.max(
    Math.hypot(directionX, directionY),
    TARGET_MIN_DIRECTION_SPEED,
  )

  return {
    x,
    y,
    directionX: directionX / directionLength,
    directionY: directionY / directionLength,
  }
}

// บังคับค่าให้อยู่ในช่วง min ถึง max เพื่อไม่ให้ตำแหน่งออกนอกขอบ
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}