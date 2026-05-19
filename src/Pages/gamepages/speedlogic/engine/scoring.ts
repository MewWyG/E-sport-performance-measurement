import type { AnswerRecord, QuestionType, SpeedLogicResult } from '../types'
import { QUESTION_TYPES, SPEED_LOGIC_CONFIG } from '../constants'
import type { QuestionScheduleStage, SpeedLogicConfig } from '../constants'

const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  addition: 1,
  subtraction: 1.1,
  multiplication: 1.4,
  comparison: 1.1,
  odd_even: 1,
  true_false: 1.2,
}

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

export function calculateTotalEarnedScore(answers: AnswerRecord[]): number {
  return answers.reduce((sum, answer) => sum + answer.earnedScore, 0)
}

type QuestionScoreParams = {
  questionType: QuestionType
  difficulty: number
  responseTimeMs: number
}

export function calculateQuestionScore({
  questionType,
  difficulty,
  responseTimeMs,
}: QuestionScoreParams): number {
  const baseScore = 10
  const typeWeight = QUESTION_TYPE_WEIGHTS[questionType]
  const difficultyMultiplier = 1 + difficulty * 0.12

  /**
   * Speed bonus เป็น bonus เล็ก ๆ เพื่อให้ตอบเร็วได้คะแนนเพิ่ม
   * แต่ไม่ให้ speed มีผลแรงเกิน accuracy/difficulty
   */
  const speedBonus = Math.max(0, 6 - responseTimeMs / 500)

  const score =
    baseScore * typeWeight * difficultyMultiplier + speedBonus

  return Math.max(1, Number(score.toFixed(2)))
}

type ProcessingScoreParams = {
  answers: AnswerRecord[]
}

export function calculateProcessingScore({
  answers,
}: ProcessingScoreParams): number {
  return Math.round(calculateTotalEarnedScore(answers))
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
      totalEarnedScore: 0,
      avgEarnedScore: 0,
    }

    return acc
  }, {} as SpeedLogicResult['questionTypeBreakdown'])

  for (const type of QUESTION_TYPES) {
    const relatedAnswers = answers.filter((answer) => answer.questionType === type)
    const correctAnswers = relatedAnswers.filter((answer) => answer.isCorrect)
    const responseTimes = relatedAnswers.map((answer) => answer.responseTimeMs)
    const earnedScores = relatedAnswers.map((answer) => answer.earnedScore)
    const totalEarnedScore = calculateTotalEarnedScore(relatedAnswers)

    breakdown[type] = {
      total: relatedAnswers.length,
      correct: correctAnswers.length,
      accuracy: Number(
        calculatePercentage(correctAnswers.length, relatedAnswers.length).toFixed(2),
      ),
      avgResponseTimeMs: Number(calculateAverage(responseTimes).toFixed(2)),
      totalEarnedScore: Number(totalEarnedScore.toFixed(2)),
      avgEarnedScore: Number(calculateAverage(earnedScores).toFixed(2)),
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
      totalEarnedScore: 0,
      avgEarnedScore: 0,
    }

    return acc
  }, {} as SpeedLogicResult['scheduleStageBreakdown'])

  for (const stage of stages) {
    const relatedAnswers = answers.filter(
      (answer) => answer.scheduleStageId === stage.id,
    )
    const correctAnswers = relatedAnswers.filter((answer) => answer.isCorrect)
    const responseTimes = relatedAnswers.map((answer) => answer.responseTimeMs)
    const earnedScores = relatedAnswers.map((answer) => answer.earnedScore)
    const totalEarnedScore = calculateTotalEarnedScore(relatedAnswers)

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
      totalEarnedScore: Number(totalEarnedScore.toFixed(2)),
      avgEarnedScore: Number(calculateAverage(earnedScores).toFixed(2)),
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