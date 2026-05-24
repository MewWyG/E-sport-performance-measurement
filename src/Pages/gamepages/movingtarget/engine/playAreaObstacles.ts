import {
  STOP_BUTTON_SAFE_AREA_HEIGHT,
  STOP_BUTTON_SAFE_AREA_RIGHT,
  STOP_BUTTON_SAFE_AREA_TOP,
  STOP_BUTTON_SAFE_AREA_WIDTH,
} from '../config'
import type { Bounds } from '../types'

// รูปทรงของพื้นที่ต้องห้ามในสนามเล่น เช่น พื้นที่ปุ่มหยุดเกม
export type ObstacleRect = {
  x: number
  y: number
  width: number
  height: number
}

type ResolveCircleRectCollisionParams = {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  rect: ObstacleRect
}

// คืนพิกัดพื้นที่ปลอดภัยรอบปุ่มหยุดเกม เพื่อให้เป้าไม่เกิดหรือเคลื่อนที่ทับปุ่ม
export function getStopButtonSafeRect(bounds: Bounds): ObstacleRect {
  return {
    x: Math.max(
      0,
      bounds.width - STOP_BUTTON_SAFE_AREA_RIGHT - STOP_BUTTON_SAFE_AREA_WIDTH,
    ),
    y: STOP_BUTTON_SAFE_AREA_TOP,
    width: STOP_BUTTON_SAFE_AREA_WIDTH,
    height: STOP_BUTTON_SAFE_AREA_HEIGHT,
  }
}

export function isCircleOverlappingRect(
  x: number,
  y: number,
  radius: number,
  rect: ObstacleRect,
) {
  const closestX = clamp(x, rect.x, rect.x + rect.width)
  const closestY = clamp(y, rect.y, rect.y + rect.height)

  const dx = x - closestX
  const dy = y - closestY

  return dx * dx + dy * dy < radius * radius
}

// ตรวจสอบและแก้ collision ระหว่างวงกลมเป้าและสี่เหลี่ยมพื้นที่ป้องกัน
export function resolveCircleRectCollision({
  x,
  y,
  radius,
  vx,
  vy,
  rect,
}: ResolveCircleRectCollisionParams) {
  if (!isCircleOverlappingRect(x, y, radius, rect)) {
    return { x, y, vx, vy }
  }

  const overlapLeft = x + radius - rect.x
  const overlapRight = rect.x + rect.width - (x - radius)
  const overlapTop = y + radius - rect.y
  const overlapBottom = rect.y + rect.height - (y - radius)

  const minOverlap = Math.min(
    overlapLeft,
    overlapRight,
    overlapTop,
    overlapBottom,
  )

  if (minOverlap === overlapLeft) {
    return {
      x: rect.x - radius,
      y,
      vx: -Math.abs(vx),
      vy,
    }
  }

  if (minOverlap === overlapRight) {
    return {
      x: rect.x + rect.width + radius,
      y,
      vx: Math.abs(vx),
      vy,
    }
  }

  if (minOverlap === overlapTop) {
    return {
      x,
      y: rect.y - radius,
      vx,
      vy: -Math.abs(vy),
    }
  }

  return {
    x,
    y: rect.y + rect.height + radius,
    vx,
    vy: Math.abs(vy),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}