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

// ทิศทางที่ใช้หา candidate จุดเกิดใหม่สำหรับเป้า
type Direction = {
  dx: number
  dy: number
  label: string
}

type CreateSpawnPointParams = {
  previousPoint: Point | null
  bounds: Bounds
  targetSize: number
  plannedDistance: number
}

type CreateDecoyPointParams = {
  correctPoint: Point
  bounds: Bounds
  targetSize: number
  decoyIndex: number
}

type SpawnPointResult = {
  point: Point
  actualDistance: number
}

type ScoredCandidate = {
  point: Point
  score: number
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
  const halfSize = targetSize / 2

  const origin = previousPoint ?? getCenterPoint(bounds)

  const validCandidates = getValidCandidates({
    origin,
    bounds,
    radius: halfSize,
    distance: plannedDistance,
  })

  if (validCandidates.length > 0) {
    const point = pickBalancedCandidate(validCandidates, bounds)

    return {
      point,
      actualDistance: getDistance(origin, point),
    }
  }

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
  const halfSize = targetSize / 2
  const decoyDistance = DECOY_MIN_DISTANCE + decoyIndex * DECOY_DISTANCE_STEP

  const validCandidates = getValidCandidates({
    origin: correctPoint,
    bounds,
    radius: halfSize,
    distance: decoyDistance,
  }).filter((point) => getDistance(point, correctPoint) >= DECOY_MIN_DISTANCE)

  if (validCandidates.length > 0) {
    return pickBalancedCandidate(validCandidates, bounds)
  }

  return createFallbackPoint({
    origin: correctPoint,
    bounds,
    radius: halfSize,
    preferredDistance: decoyDistance,
  })
}

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

  for (const direction of shuffleArray(DIRECTIONS)) {
    const point = {
      x: origin.x + direction.dx * distance,
      y: origin.y + direction.dy * distance,
    }

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

function pickBalancedCandidate(points: Point[], bounds: Bounds): Point {
  const scoredCandidates = points
    .map<ScoredCandidate>((point) => ({
      point,
      score: getCandidateBalanceScore(point, bounds),
    }))
    .sort((a, b) => a.score - b.score)

  const topCandidateCount = Math.min(
    scoredCandidates.length,
    SPAWN_TOP_CANDIDATE_COUNT,
  )
  const topCandidates = scoredCandidates.slice(0, topCandidateCount)

  return pickRandom(topCandidates).point
}

function getCandidateBalanceScore(point: Point, bounds: Bounds) {
  const center = getCenterPoint(bounds)

  const normalizedXDistance = Math.abs(point.x - center.x) / (bounds.width / 2)
  const normalizedYDistance = Math.abs(point.y - center.y) / (bounds.height / 2)

  const edgePenalty = getEdgePenalty(point, bounds)

  return (
    normalizedXDistance * SPAWN_BALANCE_X_WEIGHT +
    normalizedYDistance * SPAWN_BALANCE_Y_WEIGHT +
    edgePenalty
  )
}

function getEdgePenalty(point: Point, bounds: Bounds) {
  const leftDistance = point.x
  const rightDistance = bounds.width - point.x
  const topDistance = point.y
  const bottomDistance = bounds.height - point.y

  const nearestEdgeDistance = Math.min(
    leftDistance,
    rightDistance,
    topDistance,
    bottomDistance,
  )

  if (nearestEdgeDistance >= SPAWN_MARGIN * 2) {
    return 0
  }

  return (SPAWN_MARGIN * 2 - nearestEdgeDistance) / (SPAWN_MARGIN * 2)
}

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

function isPointValid(point: Point, bounds: Bounds, radius: number) {
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

  const isInsideBounds =
    point.x >= safeMargin &&
    point.x <= bounds.width - safeMargin &&
    point.y >= safeMargin &&
    point.y <= bounds.height - safeMargin

  if (!isInsideBounds) {
    return false
  }

  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

  return !isCircleOverlappingRect(
    point.x,
    point.y,
    radius,
    stopButtonSafeRect,
  )
}

function clampPoint(point: Point, bounds: Bounds, radius: number): Point {
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

  const clampedPoint = {
    x: clamp(point.x, safeMargin, bounds.width - safeMargin),
    y: clamp(point.y, safeMargin, bounds.height - safeMargin),
  }

  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

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

  return getNearestSafePointAwayFromRect(clampedPoint, bounds, radius)
}

function getNearestSafePointAwayFromRect(
  point: Point,
  bounds: Bounds,
  radius: number,
): Point {
  const stopButtonSafeRect = getStopButtonSafeRect(bounds)
  const safeMargin = Math.max(radius, SPAWN_MARGIN)

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
  ].map((candidate) => ({
    x: clamp(candidate.x, safeMargin, bounds.width - safeMargin),
    y: clamp(candidate.y, safeMargin, bounds.height - safeMargin),
  }))

  const safeCandidates = candidates.filter(
    (candidate) =>
      !isCircleOverlappingRect(
        candidate.x,
        candidate.y,
        radius,
        stopButtonSafeRect,
      ),
  )

  if (safeCandidates.length === 0) {
    return {
      x: bounds.width / 2,
      y: bounds.height / 2,
    }
  }

  return safeCandidates
    .map((candidate) => ({
      point: candidate,
      distance: getDistance(point, candidate),
    }))
    .sort((a, b) => a.distance - b.distance)[0].point
}

function normalizeDirection(direction: Direction): Direction {
  const length = Math.max(Math.hypot(direction.dx, direction.dy), 1)

  return {
    ...direction,
    dx: direction.dx / length,
    dy: direction.dy / length,
  }
}

function getCenterPoint(bounds: Bounds): Point {
  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
  }
}

function getDistance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function pickRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length)

  return items[index]
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}