import {
  DECOY_MIN_DISTANCE,
  DECOY_DISTANCE_STEP,
  FALLBACK_TO_CENTER_DISTANCE_RATIO,
  SPAWN_BALANCE_X_WEIGHT,
  SPAWN_BALANCE_Y_WEIGHT,
  SPAWN_DISTANCE_TOLERANCE_RATIO,
  SPAWN_MARGIN,
  SPAWN_TOP_CANDIDATE_COUNT,
} from '../config'
import type { Bounds, Point } from '../types'
import {
  getStopButtonSafeRect,
  isCircleOverlappingRect,
} from './playAreaObstacles'

// นี้ใช้แทน ทิศทาง ที่จะวางเป้าใหม่จากจุดอ้างอิง
type Direction = {
  dx: number // 1 = right, 0 = center, -1 = left
  dy: number // 1 = down, 0 = center, -1 = up
  label: string //right, up-right, up, up-left, left, down-left, down, down-right
}

//parameter ของ function createSpawnPoint()
type CreateSpawnPointParams = {
  previousPoint: Point | null //จุดอ้างอิงสำหรับ spawn เป้าใหม่
  bounds: Bounds
  targetSize: number
  plannedDistance: number //ระยะที่ต้องการให้เป้าใหม่เกิดห่างจากจุดอ้างอิง
}

//parameter ของ function createDecoyPoint()
type CreateDecoyPointParams = {
  correctPoint: Point
  bounds: Bounds
  targetSize: number //ขนาดของเป้าหลอก
  decoyIndex: number //ลำดับของเป้าหลอก
}

//ผลลัพธ์ของ createSpawnPoint()
type SpawnPointResult = {
  point: Point //ตำแหน่งเกิดที่เลือกได้จริง
  actualDistance: number //ระยะจริงจากจุดอ้างอิงถึง point
}

//เก็บตำแหน่ง candidate พร้อมคะแนนความเหมาะสมสำหรับการเลือกจุดเกิด
type ScoredCandidate = {
  point: Point
  score: number //คะแนนความเหมาะสมของจุดนั้น (ยิ่งน้อยยิ่งดี)  
}

const DIRECTIONS: Direction[] = [
  normalizeDirection({ dx: 1, dy: 0, label: 'right' }),
  normalizeDirection({ dx: 1, dy: -1, label: 'up-right' }),
  normalizeDirection({ dx: 0, dy: -1, label: 'up' }),
  normalizeDirection({ dx: -1, dy: -1, label: 'up-left' }),
  normalizeDirection({ dx: -1, dy: 0, label: 'left' }),
  normalizeDirection({ dx: -1, dy: 1, label: 'down-left' }),
  normalizeDirection({ dx: 0, dy: 1, label: 'down' }),
  normalizeDirection({ dx: 1, dy: 1, label: 'down-right' }),
]

// สร้างตำแหน่งเกิดของเป้าใหม่ โดยพยายามใกล้เคียง plannedDistance
export function createSpawnPoint({
  previousPoint,
  bounds,
  targetSize,
  plannedDistance,
}: CreateSpawnPointParams): SpawnPointResult {
  const halfSize = targetSize / 2 //คำนวณรัศมีของเป้า

  const origin = previousPoint ?? getCenterPoint(bounds) //กำหนดจุดอ้างอิงของการ spawn

  //หาตำแหน่ง candidate ที่ใช้ได้
  //ได้ Point[] จุดที่ผ่านเงื่อนไข
  const validCandidates = getValidCandidates({
    origin,
    bounds,
    radius: halfSize,
    distance: plannedDistance,
  })
  //ถ้ามี candidate ที่ใช้ได้ ให้เลือกจุดที่สมดุลที่สุด (ไม่ชิดขอบหรือมุมเกินไป)
  if (validCandidates.length > 0) {
    const point = pickBalancedCandidate(validCandidates, bounds)

    //คืนตำแหน่งที่เลือกได้ และระยะจริงจาก origin ถึง point
    return {
      point,
      actualDistance: getDistance(origin, point),
    }
  }

  // ถ้าไม่มี candidate ที่ใช้ได้เลย (เกิดขึ้นได้ยากมาก) 
  // createFallbackPoint() จะพยายามสร้างจุดที่ปลอดภัย โดยดึงกลับเข้าหากลางจอ
  const fallbackPoint = createFallbackPoint({
    origin,
    bounds,
    radius: halfSize,
    preferredDistance: plannedDistance,
  })

  return {
    point: fallbackPoint,
    actualDistance: getDistance(origin, fallbackPoint),
  }
}

// สร้างตำแหน่งจุดเกิดของเป้าหลอก ให้ห่างจากเป้าจริงในระยะที่กำหนด
export function createDecoyPoint({
  correctPoint,
  bounds,
  targetSize,
  decoyIndex,
}: CreateDecoyPointParams): Point {
  const halfSize = targetSize / 2 //คำนวณรัศมีของเป้าหลอก

  //คำนวณระยะที่เป้าหลอกควรอยู่ห่างจากเป้าจริง
  const decoyDistance = DECOY_MIN_DISTANCE + decoyIndex * DECOY_DISTANCE_STEP

  // 1. หา candidate รอบเป้าจริง
  // 2. กรองอีกทีว่าต้องห่างจากเป้าจริงอย่างน้อย DECOY_MIN_DISTANCE
  const validCandidates = getValidCandidates({
    origin: correctPoint, //เป้าหลอกจะถูกลองวางรอบเป้าจริง
    bounds,
    radius: halfSize,
    distance: decoyDistance,
  }).filter((point) => getDistance(point, correctPoint) >= DECOY_MIN_DISTANCE)

  //ถ้ามี candidate ที่ใช้ได้ ให้เลือกจุดที่ balance แล้ว return เลย
  if (validCandidates.length > 0) {
    return pickBalancedCandidate(validCandidates, bounds)
  }

  // ถ้าไม่มีให้ fallback โดยใช้ correctPoint เป็น origin
  return createFallbackPoint({
    origin: correctPoint,
    bounds,
    radius: halfSize,
    preferredDistance: decoyDistance,
  })
}

//สร้าง candidate จาก 8 ทิศ รอบ origin แล้วกรองเฉพาะจุดที่ใช้ได้
function getValidCandidates({
  origin,
  bounds,
  radius,
  distance,
}: {
  origin: Point
  bounds: Bounds
  radius: number
  distance: number
}) {
  const candidates: Point[] = []
  //วนทุก direction แบบ shuffle
  for (const direction of shuffleArray(DIRECTIONS)) {
    const point = { //คำนวณ candidate point
      x: origin.x + direction.dx * distance,
      y: origin.y + direction.dy * distance,
    }
    // check ว่าจุดนี้ ใช้ได้ไหม
    if (!isPointValid(point, bounds, radius)) {
      continue
    }

    const actualDistance = getDistance(origin, point)
    const distanceError = Math.abs(actualDistance - distance)
    const allowedError = distance * SPAWN_DISTANCE_TOLERANCE_RATIO

    if (distanceError <= allowedError) {
      candidates.push(point)
    }
  }

  return candidates
}

//เลือก candidate ที่เหมาะที่สุดจากจุดที่ใช้ได้
function pickBalancedCandidate(points: Point[], bounds: Bounds): Point {
  const scoredCandidates = points
    .map<ScoredCandidate>((point) => ({
      point,
      score: getCandidateBalanceScore(point, bounds),
    }))
    .sort((a, b) => a.score - b.score) //เรียง candidate จาก score น้อยไปมาก

  const topCandidateCount = Math.min(
    scoredCandidates.length,
    SPAWN_TOP_CANDIDATE_COUNT,
  )
  const topCandidates = scoredCandidates.slice(0, topCandidateCount)

  return pickRandom(topCandidates).point
}

//คำนวณคะแนนความเหมาะสมของ candidate
function getCandidateBalanceScore(point: Point, bounds: Bounds) {
  const center = getCenterPoint(bounds)

  //คำนวณว่า point ห่างจากกลางจอในแกน x แค่ไหน โดย normalize เป็นสัดส่วน 0–1
  const normalizedXDistance = Math.abs(point.x - center.x) / (bounds.width / 2)
  //เหมือนแกน x แต่ทำกับแกน y
  const normalizedYDistance = Math.abs(point.y - center.y) / (bounds.height / 2)

  const edgePenalty = getEdgePenalty(point, bounds)

  return (
    normalizedXDistance * SPAWN_BALANCE_X_WEIGHT +
    normalizedYDistance * SPAWN_BALANCE_Y_WEIGHT +
    edgePenalty
  )
}
//ให้ penalty ถ้า point อยู่ใกล้ขอบ
function getEdgePenalty(point: Point, bounds: Bounds) {
  const leftDistance = point.x //ระยะจาก point ถึงขอบซ้าย
  const rightDistance = bounds.width - point.x //ระยะจาก point ถึงขอบขวา
  const topDistance = point.y //ระยะจาก point ถึงขอบบน
  const bottomDistance = bounds.height - point.y //ระยะจาก point ถึงขอบล่าง
  //เลือกค่าที่น้อยที่สุด เพราะถ้าใกล้ขอบด้านใดด้านหนึ่งมาก ก็ถือว่าใกล้ขอบ
  const nearestEdgeDistance = Math.min(
    leftDistance,
    rightDistance,
    topDistance,
    bottomDistance,
  )
  //ถ้าระยะจากขอบที่ใกล้ที่สุดมากกว่าหรือเท่ากับ SPAWN_MARGIN * 2 ให้ penalty เป็น 0
  if (nearestEdgeDistance >= SPAWN_MARGIN * 2) {
    return 0
  }
  //ยิ่งใกล้ขอบ penalty ยิ่งสูง
  return (SPAWN_MARGIN * 2 - nearestEdgeDistance) / (SPAWN_MARGIN * 2)
}
//ใช้เมื่อหา valid candidate ไม่ได้เลย เพื่อสร้างจุดที่ปลอดภัยที่สุด โดยดึงกลับเข้าหากลางจอ
function createFallbackPoint({
  origin,
  bounds,
  radius,
  preferredDistance,
}: {
  origin: Point
  bounds: Bounds
  radius: number
  preferredDistance: number
}) {
  const center = getCenterPoint(bounds)
  const dx = center.x - origin.x
  const dy = center.y - origin.y
  const distanceToCenter = Math.max(Math.hypot(dx, dy), 1)

  const direction = {
    dx: dx / distanceToCenter,
    dy: dy / distanceToCenter,
  }

  const safeDistance = Math.min(
    preferredDistance,
    distanceToCenter * FALLBACK_TO_CENTER_DISTANCE_RATIO,
  )

  const point = {
    x: origin.x + direction.dx * safeDistance,
    y: origin.y + direction.dy * safeDistance,
  }

  return clampPoint(point, bounds, radius)
}

//ฟังก์ชันนี้เช็กว่า point นี้ใช้เป็นตำแหน่งเกิดได้ไหม
function isPointValid(point: Point, bounds: Bounds, radius: number) {
  //คำนวณ safeMargin เพื่อกันไม่ให้เป้าชิดขอบ
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

  //เช็กว่าอยู่ใน bounds
  const isInsideBounds =
    point.x >= safeMargin &&
    point.x <= bounds.width - safeMargin &&
    point.y >= safeMargin &&
    point.y <= bounds.height - safeMargin

  if (!isInsideBounds) {
    return false //ถ้าไม่อยู่ใน bounds ให้ false
  }

  //เช็กปุ่มจบเกมไม่ให้เกิดทับ
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)
  //ถ้าวงกลมเป้าไม่ทับปุ่ม stop → true ถ้าทับ → false
  return !isCircleOverlappingRect(
    point.x,
    point.y,
    radius,
    stopButtonSafeRect,
  )
}

//บังคับให้ point อยู่ในพื้นที่ปลอดภัย
function clampPoint(point: Point, bounds: Bounds, radius: number): Point {
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

  const clampedPoint = { //บังคับ x/y ให้อยู่ในช่วงปลอดภัย
    x: clamp(point.x, safeMargin, bounds.width - safeMargin),
    y: clamp(point.y, safeMargin, bounds.height - safeMargin),
  }
  //เอา rect ของปุ่ม stop มาเช็ก
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)
  //ถ้าไม่ทับปุ่ม stop ให้ return clampedPoint เลย
  if (
    !isCircleOverlappingRect(
      clampedPoint.x,
      clampedPoint.y,
      radius,
      stopButtonSafeRect,
    )
  ) {
    return clampedPoint
  }
  //ถ้ายังทับปุ่ม stop ให้หาจุดปลอดภัยที่ใกล้ที่สุดแทน
  return getNearestSafePointAwayFromRect(clampedPoint, bounds, radius)
}

//หาจุดปลอดภัยใกล้ที่สุดเมื่อ point ไปทับปุ่ม stop
function getNearestSafePointAwayFromRect(
  point: Point,
  bounds: Bounds,
  radius: number,
): Point {
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

  //สร้าง 3 จุด: ซ้าย, ขวา, และล่างของปุ่ม stop โดยเว้นระยะจากปุ่มเท่ากับ radius + SPAWN_MARGIN
  const candidates: Point[] = [
    {
      x: stopButtonSafeRect.x - radius - SPAWN_MARGIN,
      y: point.y,
    },
    {
      x: stopButtonSafeRect.x + stopButtonSafeRect.width + radius + SPAWN_MARGIN,
      y: point.y,
    },
    {
      x: point.x,
      y: stopButtonSafeRect.y + stopButtonSafeRect.height + radius + SPAWN_MARGIN,
    },
  ].map((candidate) => ({ //บังคับทุก candidate ให้อยู่ในสนาม
    x: clamp(candidate.x, safeMargin, bounds.width - safeMargin),
    y: clamp(candidate.y, safeMargin, bounds.height - safeMargin),
  }))

  //เก็บเฉพาะ candidate ที่ไม่ทับปุ่ม stop
  const safeCandidates = candidates.filter(
    (candidate) =>
      !isCircleOverlappingRect(
        candidate.x,
        candidate.y,
        radius,
        stopButtonSafeRect,
      ),
  )
  //ถ้าไม่มีจุดปลอดภัยเลย ให้ใช้กลางจอเป็น fallback
  if (safeCandidates.length === 0) {
    return {
      x: bounds.width / 2,
      y: bounds.height / 2,
    }
  }
  //เลือกจุดปลอดภัยที่ใกล้กับ point ที่สุด
  return safeCandidates
    .map((candidate) => ({
      point: candidate,
      distance: getDistance(point, candidate),
    }))
    .sort((a, b) => a.distance - b.distance)[0].point
}

//--------------------------helper functions--------------------------//
// ทำให้ direction มีความยาว 1 
function normalizeDirection(direction: Direction): Direction {
  const length = Math.max(Math.hypot(direction.dx, direction.dy), 1)

  return {
    ...direction,
    dx: direction.dx / length,
    dy: direction.dy / length,
  }
}

//คืนจุดกลางสนาม
function getCenterPoint(bounds: Bounds): Point {
  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
  }
}

//คำนวณระยะระหว่าง 2 จุด
function getDistance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

//สุ่ม item จาก array
function pickRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length)

  return items[index]
}

//shuffleArray()
function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temp = result[index]

    result[index] = result[randomIndex]
    result[randomIndex] = temp
  }

  return result
}

//บังคับค่าให้อยู่ในช่วง min–max
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}