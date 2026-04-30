import { PREDICTION_CONFIG } from '../config'
import type { Point, SpeedMode, TrialConfig } from '../types'
import { clamp, SeededRNG } from '../utils/math'

export function getSpeedValue(speedMode: SpeedMode): number {
  return PREDICTION_CONFIG.speed[speedMode]
}

export function createTrial(
  index: number,
  now: number,
  speedMode: SpeedMode,
  rng: SeededRNG,
): TrialConfig {
  const { width, height, margin } = PREDICTION_CONFIG.canvas
  const speed = getSpeedValue(speedMode)

  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1

  const startX = direction === 1 ? margin + 40 : width - margin - 40

  const safeTop = margin + 90
  const safeBottom = height - margin - 90

  const laneCount = 5
  const laneIndex = Math.floor(rng.range(0, laneCount))

  const laneT = laneCount === 1 ? 0.5 : laneIndex / (laneCount - 1)

  const baseY = safeTop + (safeBottom - safeTop) * laneT

  const yJitter = rng.range(-18, 18)
  const y0 = clamp(baseY + yJitter, safeTop, safeBottom)

  /**
   * จำกัด slope ให้ดูง่ายและแฟร์
   * ไม่ชันเกินไป แต่ยังมีทิศทางขึ้น/ลงเล็กน้อย
   */
  const slopeOptions = [-0.12, -0.06, 0, 0.06, 0.12]
  const slope = rng.pick(slopeOptions)

  const vx = direction * speed
  const vy = speed * slope

  return {
    index,
    startAt: now,
    hiddenStartAt: 0,

    visibleMs: rng.range(
      PREDICTION_CONFIG.trial.visibleMsRange[0],
      PREDICTION_CONFIG.trial.visibleMsRange[1],
    ),

    occlusionMs: rng.range(
      PREDICTION_CONFIG.trial.occlusionMsRange[0],
      PREDICTION_CONFIG.trial.occlusionMsRange[1],
    ),

    x0: startX,
    y0,

    vx,
    vy,

    direction,
  }
}

/**
 * ทำให้พิกัดสะท้อนกลับเมื่อเกินขอบ
 * เช่น เกินขอบขวาไป 20px จะสะท้อนกลับเข้ามา 20px
 */
function reflectCoordinate(value: number, min: number, max: number): number {
  const range = max - min
  if (range <= 0) return min

  let normalized = (value - min) % (range * 2)

  if (normalized < 0) {
    normalized += range * 2
  }

  if (normalized <= range) {
    return min + normalized
  }

  return max - (normalized - range)
}

export function getTargetPosition(trial: TrialConfig, elapsedMs: number): Point {
  const t = elapsedMs / 1000
  const { width, height, margin } = PREDICTION_CONFIG.canvas

  const left = margin
  const right = width - margin
  const top = margin
  const bottom = height - margin

  const rawX = trial.x0 + trial.vx * t
  const rawY = trial.y0 + trial.vy * t

  return {
    x: reflectCoordinate(rawX, left, right),
    y: reflectCoordinate(rawY, top, bottom),
  }
}

/**
 * สร้างเส้น guide แบบสะท้อนจริง
 * ใช้สำหรับวาดเส้นประให้เห็นว่าเป้าจะไปทางไหน
 */
export function getPathGuidePoints(
  trial: TrialConfig,
  durationMs = 4200,
  stepMs = 80,
): Point[] {
  const points: Point[] = []

  for (let t = 0; t <= durationMs; t += stepMs) {
    points.push(getTargetPosition(trial, t))
  }

  return points
}