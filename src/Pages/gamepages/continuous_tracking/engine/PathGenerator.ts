import { CONTINUOUS_TRACKING_CONFIG } from '../config'
import type { Difficulty, DistanceRange, MovementSegment, Point } from '../types'

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

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? 1 : -1
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items]

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.next() * (i + 1))
      const temp = copy[i]
      copy[i] = copy[j]
      copy[j] = temp
    }

    return copy
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function normalizeAngle(angle: number): number {
  const full = Math.PI * 2
  return ((angle % full) + full) % full
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
    angle: normalizeAngle(angle),
  }
}

function createFallbackSegment(
  start: Point,
  difficulty: Difficulty,
  distancePx: number,
  rng: SeededRNG,
): MovementSegment {
  const config = CONTINUOUS_TRACKING_CONFIG.difficulty[difficulty]
  const center = getCenterPoint()
  const angleToCenter = Math.atan2(center.y - start.y, center.x - start.x)

  const distanceToCenter = distance(start, center)

  const safeDistance = Math.max(
    40,
    Math.min(distancePx, distanceToCenter * 0.85),
  )

  const speed = rng.range(config.speed.min, config.speed.max)

  return createSegment(start, angleToCenter, safeDistance, speed)
}

function isTooCloseToForbiddenAngle(
  angle: number,
  forbiddenAngles: number[],
  thresholdDeg = 10,
): boolean {
  const threshold = degToRad(thresholdDeg)

  return forbiddenAngles.some((forbiddenAngle) => {
    const diff = Math.abs(normalizeAngle(angle) - normalizeAngle(forbiddenAngle))
    const wrappedDiff = Math.min(diff, Math.PI * 2 - diff)

    return wrappedDiff <= threshold
  })
}

function sampleDistanceFromRange(range: DistanceRange, rng: SeededRNG): number {
  return rng.range(range.min, range.max)
}

export function createInitialTargetPosition(rng: SeededRNG): Point {
  const { width, height } = CONTINUOUS_TRACKING_CONFIG.canvas

  return {
    x: width * 0.5 + rng.range(-80, 80),
    y: height * 0.5 + rng.range(-60, 60),
  }
}

/**
 * SegmentDistancePlanner:
 * - เตรียมชุดระยะตาม difficulty
 * - สุ่มค่าจากแต่ละช่วง เช่น 190–210 ได้ 198
 * - shuffle ลำดับ เช่น [198, 150, 205, ...]
 * - ส่งระยะออกไปใช้ทีละ segment
 * - เมื่อใช้หมด จะสร้างชุดใหม่และ shuffle ใหม่
 */
export class SegmentDistancePlanner {
  private difficulty: Difficulty
  private rng: SeededRNG
  private queue: number[]

  constructor(difficulty: Difficulty, rng: SeededRNG) {
    this.difficulty = difficulty
    this.rng = rng
    this.queue = []
    this.refill()
  }

  reset(difficulty: Difficulty, rng: SeededRNG): void {
    this.difficulty = difficulty
    this.rng = rng
    this.queue = []
    this.refill()
  }

  nextDistance(): number {
    if (this.queue.length === 0) {
      this.refill()
    }

    const next = this.queue.shift()

    if (typeof next === 'number') {
      return next
    }

    this.refill()
    return this.queue.shift() ?? 150
  }

  private refill(): void {
    const config = CONTINUOUS_TRACKING_CONFIG.difficulty[this.difficulty]

    const plannedDistances = config.distancePlan.map((range) =>
      sampleDistanceFromRange(range, this.rng),
    )

    this.queue = this.rng.shuffle(plannedDistances)
  }
}

/**
 * สร้าง segment ใหม่จากระยะที่ planner เตรียมไว้
 * แล้วสุ่มทิศทางและความเร็วตาม difficulty
 *
 * ถ้าทิศทางที่สุ่มจะชนขอบ:
 * - จะไม่ใช้ทิศนั้น
 * - เก็บ angle นั้นไว้เป็น forbiddenAngles
 * - สุ่ม candidate ใหม่ที่ไม่ซ้ำมุมเดิม
 *
 * ถ้าหาทิศทางที่ปลอดภัยไม่ได้เลย:
 * - fallback ให้เดินกลับเข้าหากลางสนาม
 */
export function generateNextSegment(
  start: Point,
  previousAngle: number | null,
  difficulty: Difficulty,
  rng: SeededRNG,
  distancePx: number,
): MovementSegment {
  const config = CONTINUOUS_TRACKING_CONFIG.difficulty[difficulty]
  const candidates: MovementSegment[] = []
  const forbiddenAngles: number[] = []

  for (let i = 0; i < config.candidateCount; i += 1) {
    const speed = rng.range(config.speed.min, config.speed.max)

    let angle: number
    let attempts = 0

    do {
      if (previousAngle === null) {
        angle = rng.range(0, Math.PI * 2)
      } else {
        const minTurn = degToRad(config.turnAngleDeg.min)
        const maxTurn = degToRad(config.turnAngleDeg.max)
        const turn = rng.range(minTurn, maxTurn) * rng.sign()
        angle = previousAngle + turn
      }

      angle = normalizeAngle(angle)
      attempts += 1
    } while (
      isTooCloseToForbiddenAngle(angle, forbiddenAngles) &&
      attempts < 8
    )

    const segment = createSegment(start, angle, distancePx, speed)

    if (isInsideSafeArea(segment.end, config.safeMargin)) {
      candidates.push(segment)
    } else {
      forbiddenAngles.push(angle)
    }
  }

  if (candidates.length > 0) {
    return rng.pick(candidates)
  }

  return createFallbackSegment(start, difficulty, distancePx, rng)
}