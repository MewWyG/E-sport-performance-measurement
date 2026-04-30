import type { Point, TrialConfig, TrialResult } from '../types'
import { distance } from '../utils/math'
import { getTargetPosition } from './PredictionMotion'

export function calculateTrialResult(
  trial: TrialConfig,
  click: Point,
  now: number,
): TrialResult {
  const actual = getTargetPosition(trial, now - trial.startAt)

  const predictionError = distance(click, actual)
  const timingError = now - trial.hiddenStartAt - trial.occlusionMs

  const velocityLength = Math.hypot(trial.vx, trial.vy) || 1

  const vx = trial.vx / velocityLength
  const vy = trial.vy / velocityLength

  const errorVector = {
    x: click.x - actual.x,
    y: click.y - actual.y,
  }

  const alongBias = errorVector.x * vx + errorVector.y * vy
  const lateralBias = errorVector.x * -vy + errorVector.y * vx

  return {
    trialIndex: trial.index,

    predictionError,
    timingError,

    biasX: errorVector.x,
    biasY: errorVector.y,

    alongBias,
    lateralBias,

    click,
    actual,
  }
}

export function createNoResponseResult(trial: TrialConfig, now: number): TrialResult {
  const actual = getTargetPosition(trial, now - trial.startAt)

  return {
    trialIndex: trial.index,

    predictionError: NaN,
    timingError: NaN,

    biasX: NaN,
    biasY: NaN,

    alongBias: NaN,
    lateralBias: NaN,

    click: null,
    actual,
  }
}

export function getValidResults(results: TrialResult[]): TrialResult[] {
  return results.filter((result) => Number.isFinite(result.predictionError))
}