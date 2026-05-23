import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  PLAY_AREA_DEFAULT_HEIGHT,
  PLAY_AREA_DEFAULT_WIDTH,
  PLAY_AREA_MIN_HEIGHT,
  PLAY_AREA_MIN_WIDTH,
  TOTAL_TARGETS,
} from '../config'
import {
  createDistanceSchedule,
  getDistancePlan,
  type DistanceSchedule,
} from '../engine/distanceSchedule'
import { getDifficulty } from '../engine/difficulty'
import {
  calculateAccuracy,
  calculateAverageResponseTime,
} from '../engine/scoring'
import { createTargets } from '../engine/targetFactory'
import { updateTargets } from '../engine/targetMovement'
import type {
  Bounds,
  GameMode,
  GameState,
  MovingTarget,
  MovingTargetEvent,
  MovingTargetInputEvent,
  MovingTargetMissReason,
  MovingTargetOutcome,
  Point,
} from '../types'

type UseMovingTargetGameParams = {
  areaRef: RefObject<HTMLDivElement | null>
}

export function useMovingTargetGame({ areaRef }: UseMovingTargetGameParams) {
  const animationRef = useRef<number | null>(null)

  const gameStateRef = useRef<GameState>('ready')
  const selectedModeRef = useRef<GameMode>('normal')
  const distanceScheduleRef = useRef<DistanceSchedule>(
    createDistanceSchedule('normal'),
  )

  const targetsRef = useRef<MovingTarget[]>([])

  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const wrongClicksRef = useRef(0)
  const totalResponseTimeRef = useRef(0)

  const startTimeRef = useRef<number | null>(null)
  const spawnIndexRef = useRef(0)

  const previousTargetPointRef = useRef<Point | null>(null)

  const targetEventsRef = useRef<MovingTargetEvent[]>([])
  const inputEventsRef = useRef<MovingTargetInputEvent[]>([])

  const [gameState, setGameState] = useState<GameState>('ready')
  const [selectedMode, setSelectedModeState] = useState<GameMode>('normal')

  const [targets, setTargets] = useState<MovingTarget[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [spawnedTargetCount, setSpawnedTargetCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  const [targetEvents, setTargetEvents] = useState<MovingTargetEvent[]>([])
  const [inputEvents, setInputEvents] = useState<MovingTargetInputEvent[]>([])

  const accuracy = calculateAccuracy(hits, misses, wrongClicks)

  const averageResponseTime = calculateAverageResponseTime(
    totalResponseTimeRef.current,
    hits,
  )

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'running') {
      return
    }

    let lastFrameTime = performance.now()

    const tick = (now: number) => {
      if (gameStateRef.current !== 'running') {
        return
      }

      const startTime = startTimeRef.current

      if (startTime !== null) {
        setElapsedMs(now - startTime)
      }

      const deltaMs = Math.min(now - lastFrameTime, 32)
      lastFrameTime = now

      const bounds = getPlayAreaBounds()

      const updatedTargets = updateTargets(
        targetsRef.current,
        deltaMs,
        now,
        bounds,
      )

      const correctTarget = updatedTargets.find((target) => target.isCorrect)

      const isMovementCompleted =
        correctTarget !== undefined && correctTarget.hasCompletedMovement

      const isSafetyTimeout =
        correctTarget !== undefined &&
        now - correctTarget.bornAt >= correctTarget.lifetime

      const isExpired = isMovementCompleted || isSafetyTimeout

      if (correctTarget && isExpired) {
        addMiss()

        recordTargetEvent({
          target: correctTarget,
          now,
          outcome: 'miss',
          missReason: isMovementCompleted
            ? 'movement_completed'
            : 'safety_timeout',
        })

        if (spawnIndexRef.current >= TOTAL_TARGETS) {
          finishGame(now)
          return
        }

        spawnTargets(now)
      } else {
        targetsRef.current = updatedTargets
        setTargets(updatedTargets)
      }

      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState])

  function setSelectedMode(mode: GameMode) {
    if (gameStateRef.current === 'running') {
      return
    }

    selectedModeRef.current = mode
    setSelectedModeState(mode)
  }

  function getPlayAreaBounds(): Bounds {
    const rect = areaRef.current?.getBoundingClientRect()

    const width = rect?.width ?? PLAY_AREA_DEFAULT_WIDTH
    const height = rect?.height ?? PLAY_AREA_DEFAULT_HEIGHT

    return {
      width: Math.max(width, PLAY_AREA_MIN_WIDTH),
      height: Math.max(height, PLAY_AREA_MIN_HEIGHT),
    }
  }

  function getGameTime(now = performance.now()) {
    return startTimeRef.current === null
      ? 0
      : Math.round(now - startTimeRef.current)
  }

  function resetStats(mode = selectedModeRef.current) {
    hitsRef.current = 0
    missesRef.current = 0
    wrongClicksRef.current = 0
    totalResponseTimeRef.current = 0

    startTimeRef.current = null
    spawnIndexRef.current = 0
    previousTargetPointRef.current = null

    targetsRef.current = []
    targetEventsRef.current = []
    inputEventsRef.current = []

    distanceScheduleRef.current = createDistanceSchedule(mode)

    setHits(0)
    setMisses(0)
    setWrongClicks(0)
    setSpawnedTargetCount(0)
    setElapsedMs(0)

    setTargets([])
    setTargetEvents([])
    setInputEvents([])
  }

  function startGame() {
    const mode = selectedModeRef.current

    resetStats(mode)

    const now = performance.now()

    startTimeRef.current = now
    gameStateRef.current = 'running'

    setGameState('running')
    spawnTargets(now)
  }

  function stopGame() {
    finishGame()
  }

  function finishGame(now = performance.now()) {
    gameStateRef.current = 'finished'
    targetsRef.current = []

    setTargets([])

    setElapsedMs(
      startTimeRef.current === null ? 0 : now - startTimeRef.current,
    )

    setGameState('finished')
  }

  function spawnTargets(now = performance.now()) {
    if (spawnIndexRef.current >= TOTAL_TARGETS) {
      finishGame(now)
      return
    }

    const mode = selectedModeRef.current
    const bounds = getPlayAreaBounds()
    const difficulty = getDifficulty(spawnIndexRef.current, mode)

    const distancePlan = getDistancePlan(
      distanceScheduleRef.current,
      spawnIndexRef.current,
    )

    const nextTargets = createTargets({
      difficulty,
      bounds,
      now,
      spawnIndex: spawnIndexRef.current,
      previousPoint: previousTargetPointRef.current,
      distancePlan,
    })

    spawnIndexRef.current += 1
    setSpawnedTargetCount(spawnIndexRef.current)

    const correctTarget = nextTargets.find((target) => target.isCorrect)

    if (correctTarget) {
      previousTargetPointRef.current = {
        x: correctTarget.spawnX,
        y: correctTarget.spawnY,
      }
    }

    targetsRef.current = nextTargets
    setTargets(nextTargets)
  }

  function addMiss() {
    missesRef.current += 1
    setMisses(missesRef.current)
  }

  function addWrongClick() {
    wrongClicksRef.current += 1
    setWrongClicks(wrongClicksRef.current)
  }

  function recordTargetEvent({
    target,
    now,
    outcome,
    missReason,
  }: {
    target: MovingTarget
    now: number
    outcome: MovingTargetOutcome
    missReason?: MovingTargetMissReason
  }) {
    const startTime = startTimeRef.current ?? target.bornAt
    const responseTimeMs = Math.round(now - target.bornAt)

    const event: MovingTargetEvent = {
      targetIndex: target.targetIndex,
      targetNumber: target.targetNumber,
      stageIndex: target.stageIndex,
      stageTargetIndex: target.stageTargetIndex,
      mode: target.mode,

      outcome,
      missReason,

      responseTimeMs: outcome === 'hit' ? responseTimeMs : null,

      movementStepDistance: target.movementStepDistance,
      remainingMoveDistance: Number(target.remainingMoveDistance.toFixed(2)),

      plannedSpawnDistance: target.plannedSpawnDistance,
      actualSpawnDistance: Number(target.actualSpawnDistance.toFixed(2)),

      spawnX: Number(target.spawnX.toFixed(2)),
      spawnY: Number(target.spawnY.toFixed(2)),
      finalX: Number(target.x.toFixed(2)),
      finalY: Number(target.y.toFixed(2)),

      targetSize: target.size,
      targetLifetime: target.lifetime,

      createdAtMs: Math.round(target.bornAt - startTime),
      completedAtMs: Math.round(now - startTime),
    }

    targetEventsRef.current = [...targetEventsRef.current, event]
    setTargetEvents(targetEventsRef.current)
  }

  function recordInputEvent(event: MovingTargetInputEvent) {
    inputEventsRef.current = [...inputEventsRef.current, event]
    setInputEvents(inputEventsRef.current)
  }

  function handleAreaClick() {
    if (gameStateRef.current !== 'running') {
      return
    }

    const now = performance.now()
    const correctTarget = targetsRef.current.find((target) => target.isCorrect)

    addMiss()

    recordInputEvent({
      eventType: 'empty_area_click',
      gameTimeMs: getGameTime(now),
      targetNumber: correctTarget?.targetNumber ?? null,
    })
  }

  function handleTargetClick(target: MovingTarget) {
    if (gameStateRef.current !== 'running') {
      return
    }

    const now = performance.now()

    if (!target.isCorrect) {
      addWrongClick()

      recordInputEvent({
        eventType: 'wrong_target_click',
        gameTimeMs: getGameTime(now),
        targetNumber: target.targetNumber,
        targetId: target.id,
        x: Number(target.x.toFixed(2)),
        y: Number(target.y.toFixed(2)),
      })

      return
    }

    const latestTarget =
      targetsRef.current.find((item) => item.id === target.id) ?? target

    const nextHits = hitsRef.current + 1

    hitsRef.current = nextHits
    totalResponseTimeRef.current += now - latestTarget.bornAt

    setHits(nextHits)

    recordTargetEvent({
      target: latestTarget,
      now,
      outcome: 'hit',
    })

    if (spawnIndexRef.current >= TOTAL_TARGETS) {
      finishGame(now)
      return
    }

    spawnTargets(now)
  }

  return {
    gameState,
    selectedMode,
    targets,
    hits,
    misses,
    wrongClicks,
    spawnedTargetCount,
    elapsedMs,
    accuracy,
    averageResponseTime,
    targetEvents,
    inputEvents,

    startGame,
    stopGame,
    setSelectedMode,
    handleAreaClick,
    handleTargetClick,
  }
}