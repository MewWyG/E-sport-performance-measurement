import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AVAILABLE_KEYS,
  DEFAULT_DUAL_TASK_DIFFICULTY,
  DUAL_TASK_CONFIG,
  DUAL_TASK_DIFFICULTY_PRESETS,
} from '../constants'
import type { DualTaskConfig, DualTaskDifficulty } from '../constants'
import {
  calculateAverage,
  calculateMultitaskScore,
  calculatePercentage,
  calculateStability,
} from '../engine/scoring'
import { generateKeySequence } from '../engine/sequenceGenerator'
import { createInitialTarget, updateTargetPosition } from '../engine/targetPhysics'
import { createRng, type Rng } from '../engine/rng'
import type {
  DualTaskConfigSnapshot,
  DualTaskLiveStats,
  DualTaskResult,
  GameStatus,
  KeySequence,
  Point,
  Target,
} from '../types'

type UseDualTaskGameOptions = {
  initialDifficultyMode?: DualTaskDifficulty
  onFinish?: (result: DualTaskResult) => void
}

function createInitialLiveStats(config: DualTaskConfig): DualTaskLiveStats {
  return {
    timeLeftMs: config.durationMs,
    trackingAccuracy: 0,
    averageDistance: 0,
    inputAccuracy: 0,
    completedSequences: 0,
    wrongInputs: 0,
    avgInputReactionMs: 0,
    multitaskScore: 0,
  }
}

function createConfigSnapshot(config: DualTaskConfig): DualTaskConfigSnapshot {
  return {
    label: config.label,
    durationMs: config.durationMs,

    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,

    targetRadius: config.targetRadius,
    targetBaseSpeed: config.targetBaseSpeed,
    targetMaxSpeed: config.targetMaxSpeed,

    sequenceSpawnDelayMs: config.sequenceSpawnDelayMs,
    sequenceLifetimeMs: config.sequenceLifetimeMs,

    minSequenceLength: config.minSequenceLength,
    maxSequenceLength: config.maxSequenceLength,

    movementScheduleVersion: config.movementScheduleVersion,
    movementStages: config.movementStages.map((stage) => ({ ...stage })),
  }
}

function getDualTaskConfig(mode: DualTaskDifficulty): DualTaskConfig {
  return DUAL_TASK_DIFFICULTY_PRESETS[mode]
}

export function useDualTaskGame({
  initialDifficultyMode = DEFAULT_DUAL_TASK_DIFFICULTY,
  onFinish,
}: UseDualTaskGameOptions = {}) {
  const initialConfig = getDualTaskConfig(initialDifficultyMode)

  const [status, setStatus] = useState<GameStatus>('idle')
  const [difficultyMode, setDifficultyModeState] =
    useState<DualTaskDifficulty>(initialDifficultyMode)
  const [activeSequence, setActiveSequence] = useState<KeySequence | null>(null)
  const [liveStats, setLiveStats] = useState<DualTaskLiveStats>(
    createInitialLiveStats(initialConfig),
  )
  const [latestResult, setLatestResult] = useState<DualTaskResult | null>(null)

  const statusRef = useRef<GameStatus>('idle')
  const difficultyModeRef = useRef<DualTaskDifficulty>(initialDifficultyMode)
  const selectedConfigRef = useRef<DualTaskConfig>(initialConfig)

  const animationFrameRef = useRef<number | null>(null)

  const sessionSeedRef = useRef<number>(Date.now())
  const rngRef = useRef<Rng>(createRng(sessionSeedRef.current))

  const targetRef = useRef<Target>(
    createInitialTarget(rngRef.current, selectedConfigRef.current),
  )
  const pointerRef = useRef<Point>({
    x: selectedConfigRef.current.canvasWidth / 2,
    y: selectedConfigRef.current.canvasHeight / 2,
  })

  const activeSequenceRef = useRef<KeySequence | null>(null)
  const nextSequenceAtRef = useRef<number>(0)
  const sequenceCountRef = useRef<number>(0)

  const startedAtRef = useRef<number>(0)
  const lastFrameAtRef = useRef<number>(0)
  const lastStatsUpdateAtRef = useRef<number>(0)

  const trackingSamplesRef = useRef<number>(0)
  const onTargetSamplesRef = useRef<number>(0)
  const totalDistanceRef = useRef<number>(0)
  const distanceSamplesRef = useRef<number[]>([])

  const totalKeyInputsRef = useRef<number>(0)
  const correctKeyInputsRef = useRef<number>(0)
  const wrongKeyInputsRef = useRef<number>(0)
  const completedSequencesRef = useRef<number>(0)
  const inputReactionTimesRef = useRef<number[]>([])

  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const resetInternalState = useCallback(() => {
    const config = selectedConfigRef.current

    sessionSeedRef.current = Date.now()
    rngRef.current = createRng(sessionSeedRef.current)

    targetRef.current = createInitialTarget(rngRef.current, config)

    pointerRef.current = {
      x: config.canvasWidth / 2,
      y: config.canvasHeight / 2,
    }

    activeSequenceRef.current = null
    setActiveSequence(null)

    nextSequenceAtRef.current = 0
    sequenceCountRef.current = 0

    startedAtRef.current = 0
    lastFrameAtRef.current = 0
    lastStatsUpdateAtRef.current = 0

    trackingSamplesRef.current = 0
    onTargetSamplesRef.current = 0
    totalDistanceRef.current = 0
    distanceSamplesRef.current = []

    totalKeyInputsRef.current = 0
    correctKeyInputsRef.current = 0
    wrongKeyInputsRef.current = 0
    completedSequencesRef.current = 0
    inputReactionTimesRef.current = []
  }, [])

  const setDifficultyMode = useCallback(
    (mode: DualTaskDifficulty) => {
      if (statusRef.current === 'playing') return

      const nextConfig = getDualTaskConfig(mode)

      difficultyModeRef.current = mode
      selectedConfigRef.current = nextConfig
      setDifficultyModeState(mode)

      resetInternalState()
      setLiveStats(createInitialLiveStats(nextConfig))
      setLatestResult(null)
    },
    [resetInternalState],
  )

  const buildLiveStats = useCallback((now: number): DualTaskLiveStats => {
    const config = selectedConfigRef.current

    const elapsedMs = now - startedAtRef.current
    const timeLeftMs = Math.max(0, config.durationMs - elapsedMs)

    const trackingAccuracy = calculatePercentage(
      onTargetSamplesRef.current,
      trackingSamplesRef.current,
    )

    const averageDistance =
      trackingSamplesRef.current > 0
        ? totalDistanceRef.current / trackingSamplesRef.current
        : 0

    const inputAccuracy = calculatePercentage(
      correctKeyInputsRef.current,
      totalKeyInputsRef.current,
    )

    const avgInputReactionMs = calculateAverage(inputReactionTimesRef.current)

    const multitaskScore = calculateMultitaskScore({
      trackingAccuracy,
      inputAccuracy,
      avgInputReactionMs,
      completedSequences: completedSequencesRef.current,
      wrongInputs: wrongKeyInputsRef.current,
    })

    return {
      timeLeftMs,
      trackingAccuracy,
      averageDistance,
      inputAccuracy,
      completedSequences: completedSequencesRef.current,
      wrongInputs: wrongKeyInputsRef.current,
      avgInputReactionMs,
      multitaskScore,
    }
  }, [])

  const finishGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    const now = performance.now()
    const stats = buildLiveStats(now)

    const config = selectedConfigRef.current
    const currentDifficultyMode = difficultyModeRef.current

    const result: DualTaskResult = {
      gameType: 'dual_task',
      sessionSeed: sessionSeedRef.current,
      durationMs: config.durationMs,

      difficultyMode: currentDifficultyMode,
      movementScheduleVersion: config.movementScheduleVersion,
      configSnapshot: createConfigSnapshot(config),

      trackingAccuracy: Number(stats.trackingAccuracy.toFixed(2)),
      averageDistance: Number(stats.averageDistance.toFixed(2)),
      stability: Number(calculateStability(distanceSamplesRef.current).toFixed(2)),

      inputAccuracy: Number(stats.inputAccuracy.toFixed(2)),
      completedSequences: completedSequencesRef.current,
      totalKeyInputs: totalKeyInputsRef.current,
      correctKeyInputs: correctKeyInputsRef.current,
      wrongKeyInputs: wrongKeyInputsRef.current,
      avgInputReactionMs: Number(stats.avgInputReactionMs.toFixed(2)),

      multitaskScore: stats.multitaskScore,
      playedAt: new Date().toISOString(),
    }

    statusRef.current = 'finished'
    setStatus('finished')
    setLiveStats(stats)
    setLatestResult(result)

    localStorage.setItem('latest_dual_task_result', JSON.stringify(result))
    console.log('DUAL_TASK_RESULT:', result)

    onFinishRef.current?.(result)
  }, [buildLiveStats])

  const expireSequenceIfNeeded = useCallback((now: number) => {
    const sequence = activeSequenceRef.current

    if (!sequence) return
    if (now <= sequence.expiresAt) return

    const remainingKeys = sequence.keys.length - sequence.currentIndex

    totalKeyInputsRef.current += remainingKeys
    wrongKeyInputsRef.current += remainingKeys

    activeSequenceRef.current = null
    setActiveSequence(null)

    nextSequenceAtRef.current = now + 500
  }, [])

  const spawnSequenceIfNeeded = useCallback((now: number) => {
    const config = selectedConfigRef.current

    if (activeSequenceRef.current) return
    if (now < nextSequenceAtRef.current) return

    const sequence = generateKeySequence(
      now,
      rngRef.current,
      sequenceCountRef.current,
      config,
    )

    sequenceCountRef.current += 1

    activeSequenceRef.current = sequence
    setActiveSequence(sequence)

    nextSequenceAtRef.current = now + config.sequenceSpawnDelayMs
  }, [])

  const gameLoop = useCallback(
    (now: number) => {
      if (statusRef.current !== 'playing') return

      const config = selectedConfigRef.current

      const deltaSec =
        lastFrameAtRef.current > 0
          ? (now - lastFrameAtRef.current) / 1000
          : 0

      lastFrameAtRef.current = now

      const elapsedSec = (now - startedAtRef.current) / 1000

      targetRef.current = updateTargetPosition({
        target: targetRef.current,
        deltaSec,
        elapsedSec,
        rng: rngRef.current,
        config,
      })

      const dx = pointerRef.current.x - targetRef.current.x
      const dy = pointerRef.current.y - targetRef.current.y
      const distance = Math.hypot(dx, dy)

      trackingSamplesRef.current += 1
      totalDistanceRef.current += distance
      distanceSamplesRef.current.push(distance)

      if (distance <= targetRef.current.radius) {
        onTargetSamplesRef.current += 1
      }

      expireSequenceIfNeeded(now)
      spawnSequenceIfNeeded(now)

      if (now - lastStatsUpdateAtRef.current >= 120) {
        const stats = buildLiveStats(now)
        setLiveStats(stats)
        lastStatsUpdateAtRef.current = now

        if (stats.timeLeftMs <= 0) {
          finishGame()
          return
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    },
    [
      buildLiveStats,
      expireSequenceIfNeeded,
      finishGame,
      spawnSequenceIfNeeded,
    ],
  )

  const startGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    resetInternalState()

    const now = performance.now()

    startedAtRef.current = now
    lastFrameAtRef.current = now
    lastStatsUpdateAtRef.current = now
    nextSequenceAtRef.current = now + 800

    statusRef.current = 'playing'
    setStatus('playing')
    setLatestResult(null)
    setLiveStats(createInitialLiveStats(selectedConfigRef.current))

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameLoop, resetInternalState])

  const resetGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    resetInternalState()

    statusRef.current = 'idle'
    setStatus('idle')
    setLiveStats(createInitialLiveStats(selectedConfigRef.current))
    setLatestResult(null)
  }, [resetInternalState])

  const updatePointer = useCallback((point: Point) => {
    const config = selectedConfigRef.current

    pointerRef.current = {
      x: Math.min(config.canvasWidth, Math.max(0, point.x)),
      y: Math.min(config.canvasHeight, Math.max(0, point.y)),
    }
  }, [])

  const handleKeyInput = useCallback(
    (rawKey: string) => {
      if (statusRef.current !== 'playing') return

      const key = rawKey.toUpperCase()

      if (!AVAILABLE_KEYS.includes(key as (typeof AVAILABLE_KEYS)[number])) {
        return
      }

      const sequence = activeSequenceRef.current

      if (!sequence) return

      const expectedKey = sequence.keys[sequence.currentIndex]

      totalKeyInputsRef.current += 1

      if (key !== expectedKey) {
        wrongKeyInputsRef.current += 1
        setLiveStats(buildLiveStats(performance.now()))
        return
      }

      correctKeyInputsRef.current += 1

      if (sequence.currentIndex === 0) {
        inputReactionTimesRef.current.push(performance.now() - sequence.startedAt)
      }

      const nextSequence: KeySequence = {
        ...sequence,
        currentIndex: sequence.currentIndex + 1,
      }

      if (nextSequence.currentIndex >= nextSequence.keys.length) {
        completedSequencesRef.current += 1

        activeSequenceRef.current = null
        setActiveSequence(null)

        nextSequenceAtRef.current = performance.now() + 500
      } else {
        activeSequenceRef.current = nextSequence
        setActiveSequence(nextSequence)
      }

      setLiveStats(buildLiveStats(performance.now()))
    },
    [buildLiveStats],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return

      const keyFromCode = getGameKeyFromKeyboardEvent(event)

      if (!keyFromCode) return

      event.preventDefault()
      handleKeyInput(keyFromCode)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [handleKeyInput])

  return {
    status,
    difficultyMode,
    selectedConfig: selectedConfigRef.current,
    liveStats,
    latestResult,
    activeSequence,

    targetRef,
    pointerRef,

    setDifficultyMode,
    startGame,
    resetGame,
    finishGame,
    updatePointer,
  }
}

function getGameKeyFromKeyboardEvent(event: KeyboardEvent): string | null {
  const codeToKey: Record<string, string> = {
    KeyW: 'W',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyQ: 'Q',
    KeyE: 'E',
    KeyR: 'R',
    KeyX: 'X',
  }

  return codeToKey[event.code] ?? null
}