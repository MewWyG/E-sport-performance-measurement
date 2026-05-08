import { PREDICTION_CONFIG } from '../config'
import type {
  Point,
  PredictionSummary,
  TrialConfig,
  TrialResult,
} from '../types'
import { distance, mean } from '../utils/math'
import { getTargetPosition } from './PredictionMotion'

function calculatePositionAccuracy(errorPx: number): number {
  const perfectError = PREDICTION_CONFIG.scoring.perfectErrorPx
  const maxError = PREDICTION_CONFIG.scoring.maxScoreErrorPx

  if (!Number.isFinite(errorPx)) return 0
  if (errorPx <= perfectError) return 100
  if (errorPx >= maxError) return 0

  return Math.max(
    0,
    Math.min(
      100,
      100 - ((errorPx - perfectError) / (maxError - perfectError)) * 100,
    ),
  )
}

function calculateTimingAccuracy(reactionTimeMs: number): number {
  const perfectReaction = PREDICTION_CONFIG.scoring.perfectReactionMs
  const maxReaction = PREDICTION_CONFIG.scoring.maxReactionMs

  if (!Number.isFinite(reactionTimeMs)) return 0
  if (reactionTimeMs < 0) return 0
  if (reactionTimeMs <= perfectReaction) return 100
  if (reactionTimeMs >= maxReaction) return 0

  return Math.max(
    0,
    Math.min(
      100,
      100 -
        ((reactionTimeMs - perfectReaction) /
          (maxReaction - perfectReaction)) *
          100,
    ),
  )
}

export function calculateTrialResult(
  trial: TrialConfig,
  click: Point,
  now: number,
): TrialResult {
  const actual = getTargetPosition(trial, now - trial.startAt)
  const predictionError = distance(click, actual)

  const reactionTimeMs = now - trial.clickableStartAt

  const positionAccuracy = calculatePositionAccuracy(predictionError)
  const timingAccuracy = calculateTimingAccuracy(reactionTimeMs)

  const weightedScore =
    positionAccuracy * PREDICTION_CONFIG.scoring.positionWeight +
    timingAccuracy * PREDICTION_CONFIG.scoring.timingWeight

  const trialScore = Math.round(weightedScore)

  return {
    trialIndex: trial.index,
    predictionError,
    positionAccuracy,
    timingAccuracy,
    trialScore,
    reactionTimeMs,
    click,
    actual,
    responseLabel: 'คลิกสำเร็จ',
  }
}

export function createMissResult(
  trial: TrialConfig,
  now: number,
  label = 'ไม่ได้คลิกในช่วงสีเขียว',
): TrialResult {
  const actual = getTargetPosition(trial, now - trial.startAt)

  return {
    trialIndex: trial.index,
    predictionError: NaN,
    positionAccuracy: 0,
    timingAccuracy: 0,
    trialScore: 0,
    reactionTimeMs: null,
    click: null,
    actual,
    responseLabel: label,
  }
}

export function getValidResults(results: TrialResult[]): TrialResult[] {
  return results.filter((result) => Number.isFinite(result.predictionError))
}

export function calculatePredictionSummary(
  results: TrialResult[],
): PredictionSummary {
  if (results.length === 0) {
    return {
      totalScore: 0,
      meanPredictionError: 0,
      positionAccuracy: 0,
      timingAccuracy: 0,
      meanReactionTimeMs: 0,
      completedTrials: 0,
    }
  }

  const validResults = getValidResults(results)
  const reactionResults = validResults.filter(
    (result) => result.reactionTimeMs !== null,
  )

  const totalScore = results.reduce((sum, result) => sum + result.trialScore, 0)

  return {
    totalScore,
    meanPredictionError: validResults.length
      ? mean(validResults.map((result) => result.predictionError))
      : 0,
    positionAccuracy: mean(results.map((result) => result.positionAccuracy)),
    timingAccuracy: mean(results.map((result) => result.timingAccuracy)),
    meanReactionTimeMs: reactionResults.length
      ? mean(
          reactionResults.map((result) =>
            result.reactionTimeMs === null ? 0 : result.reactionTimeMs,
          ),
        )
      : 0,
    completedTrials: validResults.length,
  }
}