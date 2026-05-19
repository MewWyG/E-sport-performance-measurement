import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SPEED_LOGIC_TEST_MODE,
  SPEED_LOGIC_CONFIG,
  SPEED_LOGIC_TEST_PRESETS,
} from '../constants'
import type {
  QuestionScheduleStage,
  SpeedLogicConfig,
  SpeedLogicTestMode,
} from '../constants'
import { clampDifficulty, updateDifficulty } from '../engine/difficulty'
import { generateQuestion } from '../engine/questionGenerator'
import {
  buildQuestionTypeBreakdown,
  buildScheduleStageBreakdown,
  calculateAverage,
  calculateFastestResponse,
  calculatePercentage,
  calculateProcessingScore,
  calculateQuestionScore,
  calculateSlowestResponse,
  calculateThroughput,
  isAnswerTooFast,
} from '../engine/scoring'
import { createRng, randomInt, type Rng } from '../engine/rng'
import type {
  AnswerRecord,
  GameStatus,
  QuestionType,
  SpeedLogicConfigSnapshot,
  SpeedLogicLiveStats,
  SpeedLogicQuestion,
  SpeedLogicResult,
} from '../types'

type UseSpeedLogicGameOptions = {
  initialTestMode?: SpeedLogicTestMode
  onFinish?: (result: SpeedLogicResult) => void
}

function getSpeedLogicConfig(mode: SpeedLogicTestMode): SpeedLogicConfig {
  return SPEED_LOGIC_TEST_PRESETS[mode]
}

function createInitialLiveStats(config: SpeedLogicConfig): SpeedLogicLiveStats {
  return {
    timeLeftMs: config.durationMs,
    score: 0,
    accuracy: 0,
    avgResponseTimeMs: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalAnswers: 0,
    currentDifficulty: config.initialDifficulty,
    maxDifficulty: config.initialDifficulty,
    streak: 0,
    throughput: 0,
  }
}

function createConfigSnapshot(config: SpeedLogicConfig): SpeedLogicConfigSnapshot {
  return {
    label: config.label,
    durationMs: config.durationMs,

    initialDifficulty: config.initialDifficulty,
    minDifficulty: config.minDifficulty,
    maxDifficulty: config.maxDifficulty,

    answerChoiceCount: config.answerChoiceCount,

    streakToIncreaseDifficulty: config.streakToIncreaseDifficulty,
    mistakesToDecreaseDifficulty: config.mistakesToDecreaseDifficulty,

    minAnswerDelayMs: config.minAnswerDelayMs,

    maxSameTypeStreak: config.maxSameTypeStreak,
    scheduleVersion: config.scheduleVersion,

    questionStages: config.questionStages.map((stage) => ({
      ...stage,
      allowedTypes: [...stage.allowedTypes],
    })),
  }
}

function getQuestionStage(
  elapsedSec: number,
  stages: readonly QuestionScheduleStage[],
): QuestionScheduleStage {
  return (
    stages.find(
      (stage) => elapsedSec >= stage.startSec && elapsedSec < stage.endSec,
    ) ?? stages[stages.length - 1]
  )
}

type QuestionTypeCountsByStage = Record<
  string,
  Partial<Record<QuestionType, number>>
>

function getTrailingSameTypeCount(types: QuestionType[]): number {
  if (types.length === 0) return 0

  const lastType = types[types.length - 1]
  let count = 0

  for (let i = types.length - 1; i >= 0; i -= 1) {
    if (types[i] !== lastType) break
    count += 1
  }

  return count
}

type SelectQuestionTypeParams = {
  rng: Rng
  stage: QuestionScheduleStage
  config: SpeedLogicConfig
  questionTypeCountsByStage: QuestionTypeCountsByStage
  recentQuestionTypes: QuestionType[]
}

function selectBalancedQuestionType({
  rng,
  stage,
  config,
  questionTypeCountsByStage,
  recentQuestionTypes,
}: SelectQuestionTypeParams): QuestionType {
  const allowedTypes = [...stage.allowedTypes]
  const stageCounts = questionTypeCountsByStage[stage.id] ?? {}

  const lastType = recentQuestionTypes[recentQuestionTypes.length - 1]
  const trailingSameTypeCount = getTrailingSameTypeCount(recentQuestionTypes)

  const eligibleTypes = allowedTypes.filter((type) => {
    if (!lastType) return true
    if (type !== lastType) return true

    return trailingSameTypeCount < config.maxSameTypeStreak
  })

  const candidatePool = eligibleTypes.length > 0 ? eligibleTypes : allowedTypes

  const minCount = Math.min(
    ...candidatePool.map((type) => stageCounts[type] ?? 0),
  )

  const leastUsedTypes = candidatePool.filter(
    (type) => (stageCounts[type] ?? 0) === minCount,
  )

  const selectedIndex = randomInt(rng, 0, leastUsedTypes.length - 1)

  return leastUsedTypes[selectedIndex]
}

export function useSpeedLogicGame({
  initialTestMode = DEFAULT_SPEED_LOGIC_TEST_MODE,
  onFinish,
}: UseSpeedLogicGameOptions = {}) {
  const initialConfig = getSpeedLogicConfig(initialTestMode)

  const [status, setStatus] = useState<GameStatus>('idle')
  const [testMode, setTestModeState] =
    useState<SpeedLogicTestMode>(initialTestMode)

  const [currentQuestion, setCurrentQuestion] =
    useState<SpeedLogicQuestion | null>(null)

  const [liveStats, setLiveStats] = useState<SpeedLogicLiveStats>(
    createInitialLiveStats(initialConfig),
  )

  const [latestResult, setLatestResult] = useState<SpeedLogicResult | null>(null)

  const statusRef = useRef<GameStatus>('idle')
  const testModeRef = useRef<SpeedLogicTestMode>(initialTestMode)
  const selectedConfigRef = useRef<SpeedLogicConfig>(initialConfig)

  const timerFrameRef = useRef<number | null>(null)

  const sessionSeedRef = useRef<number>(Date.now())
  const rngRef = useRef<Rng>(createRng(sessionSeedRef.current))

  const startedAtRef = useRef<number>(0)
  const questionCountRef = useRef<number>(0)

  const currentDifficultyRef = useRef<number>(initialConfig.initialDifficulty)
  const maxDifficultyRef = useRef<number>(initialConfig.initialDifficulty)

  const streakRef = useRef<number>(0)
  const recentMistakesRef = useRef<number>(0)

  const answersRef = useRef<AnswerRecord[]>([])
  const currentQuestionRef = useRef<SpeedLogicQuestion | null>(null)

  const questionTypeCountsByStageRef = useRef<QuestionTypeCountsByStage>({})
  const recentQuestionTypesRef = useRef<QuestionType[]>([])
  const usedPromptSetRef = useRef<Set<string>>(new Set())

  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const resetInternalState = useCallback(() => {
    const config = selectedConfigRef.current

    sessionSeedRef.current = Date.now()
    rngRef.current = createRng(sessionSeedRef.current)

    startedAtRef.current = 0
    questionCountRef.current = 0

    currentDifficultyRef.current = config.initialDifficulty
    maxDifficultyRef.current = config.initialDifficulty

    streakRef.current = 0
    recentMistakesRef.current = 0

    answersRef.current = []
    currentQuestionRef.current = null
    setCurrentQuestion(null)

    questionTypeCountsByStageRef.current = {}
    recentQuestionTypesRef.current = []
    usedPromptSetRef.current = new Set()
  }, [])

  const setTestMode = useCallback(
    (mode: SpeedLogicTestMode) => {
      if (statusRef.current === 'playing') return

      const nextConfig = getSpeedLogicConfig(mode)

      testModeRef.current = mode
      selectedConfigRef.current = nextConfig
      setTestModeState(mode)

      resetInternalState()
      setLiveStats(createInitialLiveStats(nextConfig))
      setLatestResult(null)
    },
    [resetInternalState],
  )

  const buildLiveStats = useCallback((now: number): SpeedLogicLiveStats => {
    const config = selectedConfigRef.current

    const elapsedMs = now - startedAtRef.current
    const timeLeftMs = Math.max(0, config.durationMs - elapsedMs)

    const answers = answersRef.current
    const totalAnswers = answers.length
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    const wrongAnswers = totalAnswers - correctAnswers

    const responseTimes = answers.map((answer) => answer.responseTimeMs)
    const accuracy = calculatePercentage(correctAnswers, totalAnswers)
    const avgResponseTimeMs = calculateAverage(responseTimes)
    const throughput = calculateThroughput(correctAnswers, config.durationMs)

    const score = calculateProcessingScore({
      answers,
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
    const config = selectedConfigRef.current
    const now = performance.now()

    const elapsedSec =
      startedAtRef.current > 0 ? (now - startedAtRef.current) / 1000 : 0

    const stage = getQuestionStage(elapsedSec, config.questionStages)

    currentDifficultyRef.current = clampDifficulty(
      currentDifficultyRef.current,
      stage.minDifficulty,
      stage.maxDifficulty,
    )

    maxDifficultyRef.current = Math.max(
      maxDifficultyRef.current,
      currentDifficultyRef.current,
    )

    const questionType = selectBalancedQuestionType({
      rng: rngRef.current,
      stage,
      config,
      questionTypeCountsByStage: questionTypeCountsByStageRef.current,
      recentQuestionTypes: recentQuestionTypesRef.current,
    })

    let nextQuestion: SpeedLogicQuestion | null = null

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidateQuestion = generateQuestion({
        rng: rngRef.current,
        difficulty: currentDifficultyRef.current,
        questionCount: questionCountRef.current,
        now,
        questionType,
        scheduleStageId: stage.id,
        config,
      })

      if (!usedPromptSetRef.current.has(candidateQuestion.prompt)) {
        nextQuestion = candidateQuestion
        break
      }

      nextQuestion = candidateQuestion
    }

    if (!nextQuestion) return

    usedPromptSetRef.current.add(nextQuestion.prompt)

    const stageCounts = questionTypeCountsByStageRef.current[stage.id] ?? {}
    stageCounts[questionType] = (stageCounts[questionType] ?? 0) + 1
    questionTypeCountsByStageRef.current[stage.id] = stageCounts

    recentQuestionTypesRef.current = [
      ...recentQuestionTypesRef.current,
      questionType,
    ].slice(-config.maxSameTypeStreak)

    questionCountRef.current += 1

    currentQuestionRef.current = nextQuestion
    setCurrentQuestion(nextQuestion)
  }, [])

  const finishGame = useCallback(() => {
    if (timerFrameRef.current !== null) {
      cancelAnimationFrame(timerFrameRef.current)
      timerFrameRef.current = null
    }

    const config = selectedConfigRef.current
    const currentTestMode = testModeRef.current

    const now = performance.now()
    const stats = buildLiveStats(now)

    const answers = answersRef.current
    const responseTimes = answers.map((answer) => answer.responseTimeMs)

    const result: SpeedLogicResult = {
      gameType: 'speed_logic',
      sessionSeed: sessionSeedRef.current,
      durationMs: config.durationMs,

      testMode: currentTestMode,
      scheduleVersion: config.scheduleVersion,
      configSnapshot: createConfigSnapshot(config),

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
      scheduleStageBreakdown: buildScheduleStageBreakdown(
        answers,
        config.questionStages,
      ),

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
    setLiveStats(createInitialLiveStats(selectedConfigRef.current))

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
    setLiveStats(createInitialLiveStats(selectedConfigRef.current))
    setLatestResult(null)
  }, [resetInternalState])

  const answerQuestion = useCallback(
    (selectedChoiceId: string) => {
      if (statusRef.current !== 'playing') return

      const config = selectedConfigRef.current

      const question = currentQuestionRef.current
      if (!question) return

      const now = performance.now()
      const responseTimeMs = now - question.createdAt

      if (isAnswerTooFast(responseTimeMs, config)) {
        return
      }

      const isCorrect = selectedChoiceId === question.correctChoiceId

      const questionScore = calculateQuestionScore({
        questionType: question.type,
        difficulty: question.difficulty,
        responseTimeMs,
      })

      const earnedScore = isCorrect ? questionScore : 0

      const record: AnswerRecord = {
        questionId: question.id,
        questionType: question.type,
        scheduleStageId: question.scheduleStageId,
        difficulty: question.difficulty,

        selectedChoiceId,
        correctChoiceId: question.correctChoiceId,
        isCorrect,

        questionScore,
        earnedScore,

        responseTimeMs: Number(responseTimeMs.toFixed(2)),
        answeredAt: now,
      }

      answersRef.current.push(record)

      const elapsedSec =
        startedAtRef.current > 0 ? (now - startedAtRef.current) / 1000 : 0

      const stage = getQuestionStage(elapsedSec, config.questionStages)

      const difficultyUpdate = updateDifficulty({
        currentDifficulty: currentDifficultyRef.current,
        currentStreak: streakRef.current,
        recentMistakes: recentMistakesRef.current,
        isCorrect,
        config,
        stageMinDifficulty: stage.minDifficulty,
        stageMaxDifficulty: stage.maxDifficulty,
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
    testMode,
    selectedConfig: selectedConfigRef.current,
    currentQuestion,
    liveStats,
    latestResult,

    setTestMode,
    startGame,
    resetGame,
    finishGame,
    answerQuestion,
  }
}