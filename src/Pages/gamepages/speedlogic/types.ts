import type {
  QUESTION_TYPES,
  QuestionScheduleStage,
  SpeedLogicConfig,
  SpeedLogicTestMode,
} from './constants'

export type GameStatus = 'idle' | 'playing' | 'finished'

export type QuestionType = (typeof QUESTION_TYPES)[number]

export type AnswerChoice = {
  id: string
  label: string
  value: string | number | boolean
}

export type SpeedLogicQuestion = {
  id: string
  type: QuestionType
  prompt: string
  choices: AnswerChoice[]
  correctChoiceId: string
  difficulty: number
  createdAt: number

  scheduleStageId: string
}

export type AnswerRecord = {
  questionId: string
  questionType: QuestionType
  scheduleStageId: string
  difficulty: number

  selectedChoiceId: string
  correctChoiceId: string
  isCorrect: boolean

  questionScore: number
  earnedScore: number

  responseTimeMs: number
  answeredAt: number
}

export type SpeedLogicLiveStats = {
  timeLeftMs: number
  score: number
  accuracy: number
  avgResponseTimeMs: number
  correctAnswers: number
  wrongAnswers: number
  totalAnswers: number
  currentDifficulty: number
  maxDifficulty: number
  streak: number
  throughput: number
}

export type SpeedLogicConfigSnapshot = Pick<
  SpeedLogicConfig,
  | 'label'
  | 'durationMs'
  | 'initialDifficulty'
  | 'minDifficulty'
  | 'maxDifficulty'
  | 'answerChoiceCount'
  | 'streakToIncreaseDifficulty'
  | 'mistakesToDecreaseDifficulty'
  | 'minAnswerDelayMs'
  | 'maxSameTypeStreak'
  | 'scheduleVersion'
> & {
  questionStages: QuestionScheduleStage[]
}

export type QuestionTypeBreakdownItem = {
  total: number
  correct: number
  accuracy: number
  avgResponseTimeMs: number
  totalEarnedScore: number
  avgEarnedScore: number
}

export type ScheduleStageBreakdownItem = {
  stageId: string
  startSec: number
  endSec: number
  allowedTypes: QuestionType[]
  total: number
  correct: number
  accuracy: number
  avgResponseTimeMs: number
  totalEarnedScore: number
  avgEarnedScore: number
}

export type SpeedLogicResult = {
  gameType: 'speed_logic'
  sessionSeed: number
  durationMs: number

  testMode: SpeedLogicTestMode
  scheduleVersion: string
  configSnapshot: SpeedLogicConfigSnapshot

  score: number
  accuracy: number
  avgResponseTimeMs: number
  fastestResponseMs: number
  slowestResponseMs: number

  totalAnswers: number
  correctAnswers: number
  wrongAnswers: number

  maxDifficulty: number
  finalDifficulty: number
  throughput: number

  questionTypeBreakdown: Record<QuestionType, QuestionTypeBreakdownItem>

  scheduleStageBreakdown: Record<string, ScheduleStageBreakdownItem>

  answers: AnswerRecord[]
  playedAt: string
}