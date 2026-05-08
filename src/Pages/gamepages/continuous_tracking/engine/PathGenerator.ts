import { CONTINUOUS_TRACKING_CONFIG } from '../config'
import type { Difficulty, MovementSegment, Point } from '../types'

export class SeededRNG {
  private state: number

  constructor(seed = Date.now()) {
    this.state = seed >>> 0
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? 1 : -1
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function getCenterPoint(): Point {
  const { width, height } = CONTINUOUS_TRACKING_CONFIG.canvas

  return {
    x: width / 2,
    y: height / 2,
  }
}

function isInsideSafeArea(point: Point, safeMargin: number): boolean {
  const { width, height } = CONTINUOUS_TRACKING_CONFIG.canvas

  return (
    point.x >= safeMargin &&
    point.x <= width - safeMargin &&
    point.y >= safeMargin &&
    point.y <= height - safeMargin
  )
}

function createSegment(
  start: Point,
  angle: number,
  distancePx: number,
  speed: number,
): MovementSegment {
  const end = {
    x: start.x + Math.cos(angle) * distancePx,
    y: start.y + Math.sin(angle) * distancePx,
  }

  const actualDistance = distance(start, end)

  return {
    start,
    end,
    distance: actualDistance,
    speed,
    durationMs: (actualDistance / speed) * 1000,
    angle,
  }
}

function createFallbackSegment(
  start: Point,
  difficulty: Difficulty,
  rng: SeededRNG,
): MovementSegment {
  const config = CONTINUOUS_TRACKING_CONFIG.difficulty[difficulty]
  const center = getCenterPoint()
  const angleToCenter = Math.atan2(center.y - start.y, center.x - start.x)

  const distanceToCenter = distance(start, center)
  const desiredDistance = rng.range(
    config.segmentDistance.min,
    config.segmentDistance.max,
  )

  const distancePx = Math.max(
    40,
    Math.min(desiredDistance, distanceToCenter * 0.85),
  )

  const speed = rng.range(config.speed.min, config.speed.max)

  return createSegment(start, angleToCenter, distancePx, speed)
}

export function createInitialTargetPosition(rng: SeededRNG): Point {
  const { width, height } = CONTINUOUS_TRACKING_CONFIG.canvas

  return {
    x: width * 0.5 + rng.range(-80, 80),
    y: height * 0.5 + rng.range(-60, 60),
  }
}

export function generateNextSegment(
  start: Point,
  previousAngle: number | null,
  difficulty: Difficulty,
  rng: SeededRNG,
): MovementSegment {
  const config = CONTINUOUS_TRACKING_CONFIG.difficulty[difficulty]
  const candidates: MovementSegment[] = []

  for (let i = 0; i < config.candidateCount; i += 1) {
    const distancePx = rng.range(
      config.segmentDistance.min,
      config.segmentDistance.max,
    )

    const speed = rng.range(config.speed.min, config.speed.max)

    let angle: number

    if (previousAngle === null) {
      angle = rng.range(0, Math.PI * 2)
    } else {
      const minTurn = degToRad(config.turnAngleDeg.min)
      const maxTurn = degToRad(config.turnAngleDeg.max)
      const turn = rng.range(minTurn, maxTurn) * rng.sign()
      angle = previousAngle + turn
    }

    const segment = createSegment(start, angle, distancePx, speed)

    if (isInsideSafeArea(segment.end, config.safeMargin)) {
      candidates.push(segment)
    }
  }

  if (candidates.length > 0) {
    return rng.pick(candidates)
  }

  return createFallbackSegment(start, difficulty, rng)
}