import { PREDICTION_CONFIG } from '../config'
import type { Difficulty, Point, TrialConfig } from '../types'
import { SeededRNG } from '../utils/math'

function getArenaBounds() {
  const { width, height, margin } = PREDICTION_CONFIG.canvas
  const radius = PREDICTION_CONFIG.target.radius

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

function getRawTargetPosition(trial: TrialConfig, elapsedMs: number): Point {
  const t = Math.max(0, elapsedMs) / 1000

  return {
    x: trial.x0 + trial.vx * t,
    y: trial.y0 + trial.vy * t,
  }
}

/**
 * ตรวจว่าเส้นทางทั้งเส้นอยู่ในสนามจริงตลอดเวลา
 * ถ้ามีจุดใดจุดหนึ่งหลุดกรอบ -> ใช้ไม่ได้
 */
function isValidPath(trial: TrialConfig): boolean {
  const totalDuration =
    trial.observeMs + trial.waitMs + trial.clickWindowMs

  const stepMs = 20

  for (let elapsed = 0; elapsed <= totalDuration; elapsed += stepMs) {
    const point = getRawTargetPosition(trial, elapsed)

    if (!isInsideArena(point)) {
      return false
    }
  }

  const finalPoint = getRawTargetPosition(trial, totalDuration)
  return isInsideArena(finalPoint)
}

function createCandidateTrial(
  index: number,
  now: number,
  difficulty: Difficulty,
  rng: SeededRNG,
): TrialConfig {
  const config = PREDICTION_CONFIG.difficulty[difficulty]
  const bounds = getArenaBounds()

  const observeMs = rng.range(config.observeMs.min, config.observeMs.max)
  const waitMs = rng.range(config.waitMs.min, config.waitMs.max)
  const clickWindowMs = config.clickWindowMs

  const totalDuration = observeMs + waitMs + clickWindowMs
  const totalSeconds = totalDuration / 1000

  const speed = rng.range(config.speed.min, config.speed.max)
  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1
  const slope = rng.pick(config.slopeOptions)

  const vx = direction * speed
  const vy = speed * slope

  /**
   * คำนวณตำแหน่งเริ่มต้นให้สัมพันธ์กับเวลารวม
   * เพื่อให้เส้นทางทั้งหมดไม่ชนขอบง่าย
   */

  let minStartX: number
  let maxStartX: number

  if (vx >= 0) {
    minStartX = bounds.minX
    maxStartX = bounds.maxX - vx * totalSeconds
  } else {
    minStartX = bounds.minX - vx * totalSeconds
    maxStartX = bounds.maxX
  }

  let minStartY: number
  let maxStartY: number

  if (vy >= 0) {
    minStartY = bounds.minY
    maxStartY = bounds.maxY - vy * totalSeconds
  } else {
    minStartY = bounds.minY - vy * totalSeconds
    maxStartY = bounds.maxY
  }

  /**
   * ถ้าค่า range เริ่มต้นแคบหรือผิดปกติ แปลว่าเส้นทางนี้ยาว/ชันเกินไป
   * เดี๋ยว createTrial จะสุ่มใหม่
   */
  if (minStartX > maxStartX || minStartY > maxStartY) {
    return {
      index,
      startAt: now,
      waitStartAt: 0,
      clickableStartAt: 0,
      observeMs,
      waitMs,
      clickWindowMs,
      x0: -9999,
      y0: -9999,
      vx,
      vy,
      speed,
      direction,
    }
  }

  const x0 = rng.range(minStartX, maxStartX)
  const y0 = rng.range(minStartY, maxStartY)

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
    vx,
    vy,
    speed,
    direction,
  }
}

export function createTrial(
  index: number,
  now: number,
  difficulty: Difficulty,
  rng: SeededRNG,
): TrialConfig {
  /**
   * สุ่มหลายครั้งจนกว่าจะได้เส้นทางที่:
   * - อยู่ในสนามตลอดเวลา
   * - ไม่ชนขอบ
   * - ไม่ต้อง reflect
   */
  const maxAttempts = 120

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const trial = createCandidateTrial(index, now, difficulty, rng)

    if (isValidPath(trial)) {
      return trial
    }
  }

  /**
   * fallback: ถ้าสุ่มหลายครั้งแล้วยังไม่ได้
   * ให้ใช้เส้นตรงแนวนอนกลางสนามที่ปลอดภัยแน่นอน
   */
  const config = PREDICTION_CONFIG.difficulty[difficulty]
  const bounds = getArenaBounds()

  const observeMs = rng.range(config.observeMs.min, config.observeMs.max)
  const waitMs = rng.range(config.waitMs.min, config.waitMs.max)
  const clickWindowMs = config.clickWindowMs

  const totalDuration = observeMs + waitMs + clickWindowMs
  const totalSeconds = totalDuration / 1000

  const speed = rng.range(config.speed.min, config.speed.max)
  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1
  const vx = direction * speed
  const vy = 0

  const travelX = Math.abs(vx) * totalSeconds

  let x0: number

  if (direction === 1) {
    x0 = Math.max(bounds.minX, bounds.maxX - travelX - 10)
    x0 = rng.range(bounds.minX, Math.max(bounds.minX, x0))
  } else {
    const minX = Math.min(bounds.maxX, bounds.minX + travelX + 10)
    x0 = rng.range(Math.min(minX, bounds.maxX), bounds.maxX)
  }

  const y0 = (bounds.minY + bounds.maxY) / 2

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
    vx,
    vy,
    speed,
    direction,
  }
}

export function getTargetPosition(
  trial: TrialConfig,
  elapsedMs: number,
): Point {
  /**
   * ไม่ reflect แล้ว
   * เป้าจะเคลื่อนที่ตามเส้นจริงที่สร้างไว้
   */
  return getRawTargetPosition(trial, elapsedMs)
}

export function getPathGuidePoints(
  trial: TrialConfig,
  durationMs?: number,
  stepMs = 40,
): Point[] {
  const totalDuration =
    durationMs ??
    trial.observeMs + trial.waitMs + trial.clickWindowMs

  const points: Point[] = []

  for (let elapsed = 0; elapsed <= totalDuration; elapsed += stepMs) {
    points.push(getTargetPosition(trial, elapsed))
  }

  points.push(getTargetPosition(trial, totalDuration))

  return points
}