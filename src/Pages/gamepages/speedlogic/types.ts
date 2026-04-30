import type { QUESTION_TYPES } from './constants'

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
}

export type AnswerRecord = {
  questionId: string
  questionType: QuestionType
  difficulty: number
  selectedChoiceId: string
  correctChoiceId: string
  isCorrect: boolean
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

export type SpeedLogicResult = {
  gameType: 'speed_logic'
  sessionSeed: number
  durationMs: number

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

  questionTypeBreakdown: Record<
    QuestionType,
    {
      total: number
      correct: number
      accuracy: number
      avgResponseTimeMs: number
    }
  >

  answers: AnswerRecord[]
  playedAt: string
}