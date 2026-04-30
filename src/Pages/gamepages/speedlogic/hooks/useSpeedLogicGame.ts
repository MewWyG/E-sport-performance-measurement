import { useCallback, useEffect, useRef, useState } from 'react'
import { SPEED_LOGIC_CONFIG } from '../constants'
import { updateDifficulty } from '../engine/difficulty'
import { generateQuestion } from '../engine/questionGenerator'
import {
  buildQuestionTypeBreakdown,
  calculateAverage,
  calculateFastestResponse,
  calculatePercentage,
  calculateProcessingScore,
  calculateSlowestResponse,
  calculateThroughput,
  isAnswerTooFast,
} from '../engine/scoring'
import { createRng, type Rng } from '../engine/rng'
import type {
  AnswerRecord,
  GameStatus,
  SpeedLogicLiveStats,
  SpeedLogicQuestion,
  SpeedLogicResult,
} from '../types'

type UseSpeedLogicGameOptions = {
  onFinish?: (result: SpeedLogicResult) => void
}

const initialLiveStats: SpeedLogicLiveStats = {
  timeLeftMs: SPEED_LOGIC_CONFIG.durationMs,
  score: 0,
  accuracy: 0,
  avgResponseTimeMs: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalAnswers: 0,
  currentDifficulty: SPEED_LOGIC_CONFIG.initialDifficulty,
  maxDifficulty: SPEED_LOGIC_CONFIG.initialDifficulty,
  streak: 0,
  throughput: 0,
}

export function useSpeedLogicGame({ onFinish }: UseSpeedLogicGameOptions = {}) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [currentQuestion, setCurrentQuestion] =
    useState<SpeedLogicQuestion | null>(null)
  const [liveStats, setLiveStats] =
    useState<SpeedLogicLiveStats>(initialLiveStats)
  const [latestResult, setLatestResult] = useState<SpeedLogicResult | null>(null)

  const statusRef = useRef<GameStatus>('idle')
  const timerFrameRef = useRef<number | null>(null)

  const sessionSeedRef = useRef<number>(Date.now())
  const rngRef = useRef<Rng>(createRng(sessionSeedRef.current))

  const startedAtRef = useRef<number>(0)
  const questionCountRef = useRef<number>(0)

  const currentDifficultyRef = useRef<number>(SPEED_LOGIC_CONFIG.initialDifficulty)
  const maxDifficultyRef = useRef<number>(SPEED_LOGIC_CONFIG.initialDifficulty)
  const streakRef = useRef<number>(0)
  const recentMistakesRef = useRef<number>(0)

  const answersRef = useRef<AnswerRecord[]>([])
  const currentQuestionRef = useRef<SpeedLogicQuestion | null>(null)

  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const buildLiveStats = useCallback((now: number): SpeedLogicLiveStats => {
    const elapsedMs = now - startedAtRef.current
    const timeLeftMs = Math.max(0, SPEED_LOGIC_CONFIG.durationMs - elapsedMs)

    const answers = answersRef.current
    const totalAnswers = answers.length
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    const wrongAnswers = totalAnswers - correctAnswers

    const responseTimes = answers.map((answer) => answer.responseTimeMs)
    const accuracy = calculatePercentage(correctAnswers, totalAnswers)
    const avgResponseTimeMs = calculateAverage(responseTimes)
    const throughput = calculateThroughput(correctAnswers, SPEED_LOGIC_CONFIG.durationMs)

    const score = calculateProcessingScore({
      accuracy,
      avgResponseTimeMs,
      correctAnswers,
      maxDifficulty: maxDifficultyRef.current,
    })

    return {
      timeLeftMs,
      score,
      accuracy,
      avgResponseTimeMs,
      correctAnswers,
      wrongAnswers,
      totalAnswers,
      currentDifficulty: currentDifficultyRef.current,
      maxDifficulty: maxDifficultyRef.current,
      streak: streakRef.current,
      throughput,
    }
  }, [])

  const createNextQuestion = useCallback(() => {
    const now = performance.now()

    const nextQuestion = generateQuestion({
      rng: rngRef.current,
      difficulty: currentDifficultyRef.current,
      questionCount: questionCountRef.current,
      now,
    })

    questionCountRef.current += 1

    currentQuestionRef.current = nextQuestion
    setCurrentQuestion(nextQuestion)
  }, [])

  const resetInternalState = useCallback(() => {
    sessionSeedRef.current = Date.now()
    rngRef.current = createRng(sessionSeedRef.current)

    startedAtRef.current = 0
    questionCountRef.current = 0

    currentDifficultyRef.current = SPEED_LOGIC_CONFIG.initialDifficulty
    maxDifficultyRef.current = SPEED_LOGIC_CONFIG.initialDifficulty
    streakRef.current = 0
    recentMistakesRef.current = 0

    answersRef.current = []
    currentQuestionRef.current = null
    setCurrentQuestion(null)
  }, [])

  const finishGame = useCallback(() => {
    if (timerFrameRef.current !== null) {
      cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }

    const now = performance.now()
    const stats = buildLiveStats(now)

    const answers = answersRef.current
    const responseTimes = answers.map((answer) => answer.responseTimeMs)

    const result: SpeedLogicResult = {
      gameType: 'speed_logic',
      sessionSeed: sessionSeedRef.current,
      durationMs: SPEED_LOGIC_CONFIG.durationMs,

      score: stats.score,
      accuracy: Number(stats.accuracy.toFixed(2)),
      avgResponseTimeMs: Number(calculateAverage(responseTimes).toFixed(2)),
      fastestResponseMs: Number(calculateFastestResponse(answers).toFixed(2)),
      slowestResponseMs: Number(calculateSlowestResponse(answers).toFixed(2)),

      totalAnswers: stats.totalAnswers,
      correctAnswers: stats.correctAnswers,
      wrongAnswers: stats.wrongAnswers,

      maxDifficulty: maxDifficultyRef.current,
      finalDifficulty: currentDifficultyRef.current,
      throughput: Number(stats.throughput.toFixed(2)),

      questionTypeBreakdown: buildQuestionTypeBreakdown(answers),

      answers,
      playedAt: new Date().toISOString(),
    }

    statusRef.current = 'finished'
    setStatus('finished')
    setLiveStats(stats)
    setLatestResult(result)

    localStorage.setItem('latest_speed_logic_result', JSON.stringify(result))
    console.log('SPEED_LOGIC_RESULT:', result)

    onFinishRef.current?.(result)
  }, [buildLiveStats])

  const tick = useCallback(
    (now: number) => {
      if (statusRef.current !== 'playing') return

      const stats = buildLiveStats(now)
      setLiveStats(stats)

      if (stats.timeLeftMs <= 0) {
        finishGame()
        return
      }

      timerFrameRef.current = requestAnimationFrame(tick)
    },
    [buildLiveStats, finishGame],
  )

  const startGame = useCallback(() => {
    if (timerFrameRef.current !== null) {
      cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }

    resetInternalState()

    const now = performance.now()

    startedAtRef.current = now

    statusRef.current = 'playing'
    setStatus('playing')
    setLatestResult(null)
    setLiveStats(initialLiveStats)

    createNextQuestion()

    timerFrameRef.current = requestAnimationFrame(tick)
  }, [createNextQuestion, resetInternalState, tick])

  const resetGame = useCallback(() => {
    if (timerFrameRef.current !== null) {
      cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }

    resetInternalState()

    statusRef.current = 'idle'
    setStatus('idle')
    setLiveStats(initialLiveStats)
    setLatestResult(null)
  }, [resetInternalState])

  const answerQuestion = useCallback(
    (selectedChoiceId: string) => {
      if (statusRef.current !== 'playing') return

      const question = currentQuestionRef.current
      if (!question) return

      const now = performance.now()
      const responseTimeMs = now - question.createdAt

      if (isAnswerTooFast(responseTimeMs)) {
        return
      }

      const isCorrect = selectedChoiceId === question.correctChoiceId

      const record: AnswerRecord = {
        questionId: question.id,
        questionType: question.type,
        difficulty: question.difficulty,
        selectedChoiceId,
        correctChoiceId: question.correctChoiceId,
        isCorrect,
        responseTimeMs: Number(responseTimeMs.toFixed(2)),
        answeredAt: now,
      }

      answersRef.current.push(record)

      const difficultyUpdate = updateDifficulty({
        currentDifficulty: currentDifficultyRef.current,
        currentStreak: streakRef.current,
        recentMistakes: recentMistakesRef.current,
        isCorrect,
      })

      currentDifficultyRef.current = difficultyUpdate.nextDifficulty
      streakRef.current = difficultyUpdate.nextStreak
      recentMistakesRef.current = difficultyUpdate.nextRecentMistakes

      maxDifficultyRef.current = Math.max(
        maxDifficultyRef.current,
        currentDifficultyRef.current,
      )

      setLiveStats(buildLiveStats(now))
      createNextQuestion()
    },
    [buildLiveStats, createNextQuestion],
  )

  useEffect(() => {
    return () => {
      if (timerFrameRef.current !== null) {
        cancelAnimationFrame(timerFrameRef.current)
      }
    }
  }, [])

  return {
    status,
    currentQuestion,
    liveStats,
    latestResult,

    startGame,
    resetGame,
    finishGame,
    answerQuestion,
  }
}