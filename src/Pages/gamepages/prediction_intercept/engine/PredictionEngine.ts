import { PREDICTION_CONFIG } from '../config'
import type { Difficulty, Point, TrialConfig } from '../types'
import { SeededRNG } from '../utils/math'

function getArenaBounds() {
  const { width, height, margin } = PREDICTION_CONFIG.canvas
  const radius = PREDICTION_CONFIG.target.ringRadius

  return {
    minX: margin + radius,
    maxX: width - margin - radius,
    minY: margin + radius,
    maxY: height - margin - radius,
  }
}

function isInsideArena(point: Point): boolean {
  const bounds = getArenaBounds()

  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  )
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function createCandidateTrial(
  index: number,
  now: number,
  difficulty: Difficulty,
  rng: SeededRNG,
): TrialConfig | null {
  const config = PREDICTION_CONFIG.difficulty[difficulty]
  const bounds = getArenaBounds()

  const observeMs = rng.range(config.observeMs.min, config.observeMs.max)
  const waitMs = rng.range(config.waitMs.min, config.waitMs.max)
  const clickWindowMs = config.clickWindowMs

  const totalMotionMs = observeMs + waitMs + clickWindowMs
  const totalSeconds = totalMotionMs / 1000

  const speed = rng.range(config.speed.min, config.speed.max)
  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1
  const slope = rng.pick(config.slopeOptions)

  const vx = direction * speed
  const vy = speed * slope

  const travelX = vx * totalSeconds
  const travelY = vy * totalSeconds

  let minStartX: number
  let maxStartX: number

  if (travelX >= 0) {
    minStartX = bounds.minX
    maxStartX = bounds.maxX - travelX
  } else {
    minStartX = bounds.minX - travelX
    maxStartX = bounds.maxX
  }

  let minStartY: number
  let maxStartY: number

  if (travelY >= 0) {
    minStartY = bounds.minY
    maxStartY = bounds.maxY - travelY
  } else {
    minStartY = bounds.minY - travelY
    maxStartY = bounds.maxY
  }

  if (minStartX > maxStartX || minStartY > maxStartY) {
    return null
  }

  const x0 = rng.range(minStartX, maxStartX)
  const y0 = rng.range(minStartY, maxStartY)

  const endX = x0 + travelX
  const endY = y0 + travelY

  const startPoint = { x: x0, y: y0 }
  const endPoint = { x: endX, y: endY }

  if (!isInsideArena(startPoint) || !isInsideArena(endPoint)) {
    return null
  }

  return {
    index,

    startAt: now,
    waitStartAt: 0,
    clickableStartAt: 0,

    observeMs,
    waitMs,
    clickWindowMs,

    x0,
    y0,

    endX,
    endY,

    vx,
    vy,

    speed,
    direction,

    totalMotionMs,
  }
}

export function createTrial(
  index: number,
  now: number,
  difficulty: Difficulty,
  rng: SeededRNG,
): TrialConfig {
  const maxAttempts = 200

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const trial = createCandidateTrial(index, now, difficulty, rng)

    if (trial) {
      return trial
    }
  }

  /**
   * fallback แบบปลอดภัยแน่นอน:
   * ใช้เส้นแนวนอนกลางสนาม
   */
  const config = PREDICTION_CONFIG.difficulty[difficulty]
  const bounds = getArenaBounds()

  const observeMs = rng.range(config.observeMs.min, config.observeMs.max)
  const waitMs = rng.range(config.waitMs.min, config.waitMs.max)
  const clickWindowMs = config.clickWindowMs
  const totalMotionMs = observeMs + waitMs + clickWindowMs
  const totalSeconds = totalMotionMs / 1000

  const speed = rng.range(config.speed.min, config.speed.max)
  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1
  const vx = direction * speed
  const vy = 0

  const travelX = Math.abs(vx) * totalSeconds
  const safeTravelX = Math.min(travelX, (bounds.maxX - bounds.minX) * 0.75)

  const x0 =
    direction === 1
      ? bounds.minX + 20
      : bounds.maxX - 20

  const endX =
    direction === 1
      ? x0 + safeTravelX
      : x0 - safeTravelX

  const y0 = (bounds.minY + bounds.maxY) / 2
  const endY = y0

  return {
    index,

    startAt: now,
    waitStartAt: 0,
    clickableStartAt: 0,

    observeMs,
    waitMs,
    clickWindowMs,

    x0,
    y0,

    endX,
    endY,

    vx: direction === 1 ? safeTravelX / totalSeconds : -safeTravelX / totalSeconds,
    vy,

    speed,
    direction,

    totalMotionMs,
  }
}

export function getTargetPosition(
  trial: TrialConfig,
  elapsedMs: number,
): Point {
  /**
   * ตำแหน่งเป้าหมายคำนวณจากเส้นเดียวกับเส้นประเสมอ
   */
  const t = clamp01(elapsedMs / trial.totalMotionMs)

  return {
    x: lerp(trial.x0, trial.endX, t),
    y: lerp(trial.y0, trial.endY, t),
  }
}

export function getPathGuidePoints(
  trial: TrialConfig,
  durationMs?: number,
  stepMs = 40,
): Point[] {
  const totalDuration = durationMs ?? trial.totalMotionMs
  const points: Point[] = []

  for (let elapsed = 0; elapsed <= totalDuration; elapsed += stepMs) {
    points.push(getTargetPosition(trial, elapsed))
  }

  points.push(getTargetPosition(trial, totalDuration))

  return points
}