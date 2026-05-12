import type { AnswerRecord, SpeedLogicResult } from '../types'
import { QUESTION_TYPES, SPEED_LOGIC_CONFIG } from '../constants'
import type { QuestionScheduleStage, SpeedLogicConfig } from '../constants'

export function calculatePercentage(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function calculateThroughput(
  correctAnswers: number,
  durationMs: number,
): number {
  const durationSec = durationMs / 1000
  if (durationSec <= 0) return 0

  return correctAnswers / durationSec
}

type ProcessingScoreParams = {
  accuracy: number
  avgResponseTimeMs: number
  correctAnswers: number
  maxDifficulty: number
}

export function calculateProcessingScore({
  accuracy,
  avgResponseTimeMs,
  correctAnswers,
  maxDifficulty,
}: ProcessingScoreParams): number {
  const accuracyPart = accuracy * 4
  const speedPart = Math.max(0, 250 - avgResponseTimeMs / 6)
  const volumePart = correctAnswers * 8
  const difficultyPart = maxDifficulty * 35

  const score = accuracyPart + speedPart + volumePart + difficultyPart

  return Math.max(0, Math.round(score))
}

export function buildQuestionTypeBreakdown(
  answers: AnswerRecord[],
): SpeedLogicResult['questionTypeBreakdown'] {
  const breakdown = QUESTION_TYPES.reduce((acc, type) => {
    acc[type] = {
      total: 0,
      correct: 0,
      accuracy: 0,
      avgResponseTimeMs: 0,
    }

    return acc
  }, {} as SpeedLogicResult['questionTypeBreakdown'])

  for (const type of QUESTION_TYPES) {
    const relatedAnswers = answers.filter((answer) => answer.questionType === type)
    const correctAnswers = relatedAnswers.filter((answer) => answer.isCorrect)
    const responseTimes = relatedAnswers.map((answer) => answer.responseTimeMs)

    breakdown[type] = {
      total: relatedAnswers.length,
      correct: correctAnswers.length,
      accuracy: Number(
        calculatePercentage(correctAnswers.length, relatedAnswers.length).toFixed(2),
      ),
      avgResponseTimeMs: Number(calculateAverage(responseTimes).toFixed(2)),
    }
  }

  return breakdown
}

export function buildScheduleStageBreakdown(
  answers: AnswerRecord[],
  stages: readonly QuestionScheduleStage[],
): SpeedLogicResult['scheduleStageBreakdown'] {
  const breakdown = stages.reduce((acc, stage) => {
    acc[stage.id] = {
      stageId: stage.id,
      startSec: stage.startSec,
      endSec: stage.endSec,
      allowedTypes: [...stage.allowedTypes],
      total: 0,
      correct: 0,
      accuracy: 0,
      avgResponseTimeMs: 0,
    }

    return acc
  }, {} as SpeedLogicResult['scheduleStageBreakdown'])

  for (const stage of stages) {
    const relatedAnswers = answers.filter(
      (answer) => answer.scheduleStageId === stage.id,
    )
    const correctAnswers = relatedAnswers.filter((answer) => answer.isCorrect)
    const responseTimes = relatedAnswers.map((answer) => answer.responseTimeMs)

    breakdown[stage.id] = {
      stageId: stage.id,
      startSec: stage.startSec,
      endSec: stage.endSec,
      allowedTypes: [...stage.allowedTypes],
      total: relatedAnswers.length,
      correct: correctAnswers.length,
      accuracy: Number(
        calculatePercentage(correctAnswers.length, relatedAnswers.length).toFixed(2),
      ),
      avgResponseTimeMs: Number(calculateAverage(responseTimes).toFixed(2)),
    }
  }

  return breakdown
}

export function calculateFastestResponse(answers: AnswerRecord[]): number {
  if (answers.length === 0) return 0
  return Math.min(...answers.map((answer) => answer.responseTimeMs))
}

export function calculateSlowestResponse(answers: AnswerRecord[]): number {
  if (answers.length === 0) return 0
  return Math.max(...answers.map((answer) => answer.responseTimeMs))
}

export function isAnswerTooFast(
  responseTimeMs: number,
  config: SpeedLogicConfig = SPEED_LOGIC_CONFIG,
): boolean {
  return responseTimeMs < config.minAnswerDelayMs
}