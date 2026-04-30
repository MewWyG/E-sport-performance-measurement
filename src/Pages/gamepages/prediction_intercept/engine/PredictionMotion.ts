import { PREDICTION_CONFIG } from '../config'
import type { MotionMode, Point, SpeedMode, TrialConfig } from '../types'
import { randomRange, reflectCoordinate } from '../utils/math'

export function getSpeedValue(speedMode: SpeedMode): number {
  return PREDICTION_CONFIG.speed[speedMode]
}

export function createTrial(
  index: number,
  now: number,
  motionMode: MotionMode,
  speedMode: SpeedMode,
): TrialConfig {
  const speed = getSpeedValue(speedMode)

  const angle = randomRange(-Math.PI * 0.85, Math.PI * 0.85)
  const direction = Math.random() < 0.5 ? 1 : -1

  const { width, height, margin } = PREDICTION_CONFIG.canvas

  const x0 =
    direction > 0
      ? randomRange(margin + 40, width * 0.35)
      : randomRange(width * 0.65, width - margin - 40)

  const y0 = randomRange(margin + 80, height - margin - 80)

  const vx = Math.cos(angle) * speed * direction
  const vy = Math.sin(angle) * speed * 0.55

  const accelerationStrength =
    motionMode === 'acceleration'
      ? randomRange(PREDICTION_CONFIG.acceleration.min, PREDICTION_CONFIG.acceleration.max)
      : 0

  return {
    index,
    startAt: now,
    hiddenStartAt: 0,

    visibleMs: randomRange(
      PREDICTION_CONFIG.trial.visibleMsRange[0],
      PREDICTION_CONFIG.trial.visibleMsRange[1],
    ),

    occlusionMs: randomRange(
      PREDICTION_CONFIG.trial.occlusionMsRange[0],
      PREDICTION_CONFIG.trial.occlusionMsRange[1],
    ),

    x0,
    y0,
    vx,
    vy,

    ax: Math.cos(angle) * accelerationStrength * direction,
    ay: Math.sin(angle) * accelerationStrength * 0.4,

    curveAmplitude:
      motionMode === 'curve'
        ? randomRange(
            PREDICTION_CONFIG.curve.amplitudeRange[0],
            PREDICTION_CONFIG.curve.amplitudeRange[1],
          )
        : 0,

    curveFrequency: randomRange(
      PREDICTION_CONFIG.curve.frequencyRange[0],
      PREDICTION_CONFIG.curve.frequencyRange[1],
    ),

    curvePhase: randomRange(0, Math.PI * 2),

    motionMode,
  }
}

export function getTargetPosition(trial: TrialConfig, elapsedMs: number): Point {
  const t = elapsedMs / 1000

  let x = trial.x0 + trial.vx * t + 0.5 * trial.ax * t * t
  let y = trial.y0 + trial.vy * t + 0.5 * trial.ay * t * t

  if (trial.motionMode === 'curve') {
    const baseAngle = Math.atan2(trial.vy, trial.vx)

    const perpX = -Math.sin(baseAngle)
    const perpY = Math.cos(baseAngle)

    const wave =
      Math.sin(t * Math.PI * 2 * trial.curveFrequency + trial.curvePhase) *
      trial.curveAmplitude

    x += perpX * wave
    y += perpY * wave
  }

  const { width, height, margin } = PREDICTION_CONFIG.canvas

  return {
    x: reflectCoordinate(x, margin, width - margin),
    y: reflectCoordinate(y, margin, height - margin),
  }
}