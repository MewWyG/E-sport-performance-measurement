import {
  DECOY_MIN_DISTANCE,
  SPAWN_MARGIN,
  SPAWN_POINT_MAX_ATTEMPTS,
  ZONE_COLUMNS,
  ZONE_ROWS,
} from '../config'
import type { Bounds, Point } from '../types'
import { randomBetween } from '../utils/random'
import {
  getStopButtonSafeRect,
  isCircleOverlappingRect,
} from './playAreaObstacles'

const TOTAL_ZONES = ZONE_ROWS * ZONE_COLUMNS

export function createZoneUseCounts() {
  return Array.from({ length: TOTAL_ZONES }, () => 0)
}

export function pickNextTargetZone(
  previousZoneId: number | null,
  zoneUseCounts: number[],
) {
  const allZones = getAllZoneIds()

  if (previousZoneId === null) {
    return pickFromLowestUsedZones([4, 1, 3, 5, 7], zoneUseCounts)
  }

  const candidates = allZones.filter((zoneId) => {
    if (zoneId === previousZoneId) {
      return false
    }

    const distance = getZoneManhattanDistance(previousZoneId, zoneId)

    return distance <= 3
  })

  if (candidates.length === 0) {
    return pickFromLowestUsedZones(
      allZones.filter((zoneId) => zoneId !== previousZoneId),
      zoneUseCounts,
    )
  }

  return pickFromLowestUsedZones(candidates, zoneUseCounts)
}

export function pickDecoyZones(
  correctZoneId: number,
  decoyCount: number,
  zoneUseCounts: number[],
) {
  const selectedZones: number[] = []
  const allZones = getAllZoneIds()

  for (let i = 0; i < decoyCount; i += 1) {
    const candidates = allZones.filter((zoneId) => {
      return zoneId !== correctZoneId && !selectedZones.includes(zoneId)
    })

    selectedZones.push(pickFromLowestUsedZones(candidates, zoneUseCounts))
  }

  return selectedZones
}

export function pickPointInZone(
  bounds: Bounds,
  size: number,
  zoneId: number,
): Point {
  const { row, column } = getZonePosition(zoneId)

  const cellWidth = bounds.width / ZONE_COLUMNS
  const cellHeight = bounds.height / ZONE_ROWS

  const halfSize = size / 2
  const margin = SPAWN_MARGIN + halfSize

  const minX = column * cellWidth + margin
  const maxX = (column + 1) * cellWidth - margin

  const minY = row * cellHeight + margin
  const maxY = (row + 1) * cellHeight - margin

  const fallbackX = column * cellWidth + cellWidth / 2
  const fallbackY = row * cellHeight + cellHeight / 2

  const stopButtonSafeRect = getStopButtonSafeRect(bounds)

  for (let attempt = 0; attempt < SPAWN_POINT_MAX_ATTEMPTS; attempt += 1) {
    const point = {
      x: maxX <= minX ? fallbackX : randomBetween(minX, maxX),
      y: maxY <= minY ? fallbackY : randomBetween(minY, maxY),
    }

    if (!isCircleOverlappingRect(point.x, point.y, halfSize, stopButtonSafeRect)) {
      return point
    }
  }

  const centeredPoint = {
    x: fallbackX,
    y: fallbackY,
  }

  if (
    !isCircleOverlappingRect(
      centeredPoint.x,
      centeredPoint.y,
      halfSize,
      stopButtonSafeRect,
    )
  ) {
    return centeredPoint
  }

  const shiftedLeftPoint = {
    x: clamp(stopButtonSafeRect.x - halfSize - 12, minX, maxX),
    y: clamp(fallbackY, minY, maxY),
  }

  if (
    !isCircleOverlappingRect(
      shiftedLeftPoint.x,
      shiftedLeftPoint.y,
      halfSize,
      stopButtonSafeRect,
    )
  ) {
    return shiftedLeftPoint
  }

  const shiftedDownPoint = {
    x: clamp(fallbackX, minX, maxX),
    y: clamp(stopButtonSafeRect.y + stopButtonSafeRect.height + halfSize + 12, minY, maxY),
  }

  return shiftedDownPoint
}

export function isFarEnoughFromCorrectTarget(
  point: Point,
  correctPoint: Point,
) {
  return getDistance(point, correctPoint) >= DECOY_MIN_DISTANCE
}

function pickFromLowestUsedZones(zoneIds: number[], zoneUseCounts: number[]) {
  if (zoneIds.length === 0) {
    return 4
  }

  const minUseCount = Math.min(
    ...zoneIds.map((zoneId) => zoneUseCounts[zoneId] ?? 0),
  )

  const leastUsedZones = zoneIds.filter((zoneId) => {
    return (zoneUseCounts[zoneId] ?? 0) === minUseCount
  })

  const index = Math.floor(Math.random() * leastUsedZones.length)

  return leastUsedZones[index]
}

function getAllZoneIds() {
  return Array.from({ length: TOTAL_ZONES }, (_, index) => index)
}

function getZonePosition(zoneId: number) {
  return {
    row: Math.floor(zoneId / ZONE_COLUMNS),
    column: zoneId % ZONE_COLUMNS,
  }
}

function getZoneManhattanDistance(a: number, b: number) {
  const zoneA = getZonePosition(a)
  const zoneB = getZonePosition(b)

  return Math.abs(zoneA.row - zoneB.row) + Math.abs(zoneA.column - zoneB.column)
}

function getDistance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}