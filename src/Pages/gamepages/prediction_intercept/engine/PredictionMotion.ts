import { PREDICTION_CONFIG } from '../config'
import type { Difficulty, Point, TrialConfig } from '../types'
import { reflectCoordinate, SeededRNG } from '../utils/math'

export function createTrial(
  index: number,
  now: number,
  difficulty: Difficulty,
  rng: SeededRNG,
): TrialConfig {
  const config = PREDICTION_CONFIG.difficulty[difficulty]
  const { width, height, margin } = PREDICTION_CONFIG.canvas

  const direction: 1 | -1 = rng.next() < 0.5 ? 1 : -1

  const x0 =
    direction === 1
      ? margin + 56
      : width - margin - 56

  const laneCount = 5
  const laneIndex = Math.floor(rng.range(0, laneCount))
  const laneTop = margin + 95
  const laneBottom = height - margin - 95
  const laneT = laneCount === 1 ? 0.5 : laneIndex / (laneCount - 1)

  const y0 = laneTop + (laneBottom - laneTop) * laneT + rng.range(-18, 18)

  const speed = rng.range(config.speed.min, config.speed.max)
  const slope = rng.pick(config.slopeOptions)

  const vx = direction * speed
  const vy = speed * slope

  return {
    index,

    startAt: now,
    waitStartAt: 0,
    clickableStartAt: 0,

    observeMs: rng.range(config.observeMs.min, config.observeMs.max),
    waitMs: rng.range(config.waitMs.min, config.waitMs.max),
    clickWindowMs: config.clickWindowMs,

    x0,
    y0,

    vx,
    vy,

    speed,
    direction,
  }
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

export function getPathGuidePoints(
  trial: TrialConfig,
  durationMs = 4200,
  stepMs = 90,
): Point[] {
  const points: Point[] = []

  for (let t = 0; t <= durationMs; t += stepMs) {
    points.push(getTargetPosition(trial, t))
  }

  return points
}