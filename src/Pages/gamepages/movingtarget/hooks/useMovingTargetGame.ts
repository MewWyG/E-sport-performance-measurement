import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  PLAY_AREA_DEFAULT_HEIGHT,
  PLAY_AREA_DEFAULT_WIDTH,
  PLAY_AREA_MIN_HEIGHT,
  PLAY_AREA_MIN_WIDTH,
  TOTAL_TARGETS,
} from '../config'
import { getDifficulty } from '../engine/difficulty'
import {
  calculateAccuracy,
  calculateAverageResponseTime,
} from '../engine/scoring'
import { createTargets } from '../engine/targetFactory'
import { updateTargets } from '../engine/targetMovement'
import { createZoneUseCounts } from '../engine/spawnZones'
import type { Bounds, GameState, MovingTarget } from '../types'

type UseMovingTargetGameParams = {
  areaRef: RefObject<HTMLDivElement | null>
}

export function useMovingTargetGame({ areaRef }: UseMovingTargetGameParams) {
  const animationRef = useRef<number | null>(null)

  const gameStateRef = useRef<GameState>('ready')
  const targetsRef = useRef<MovingTarget[]>([])
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const wrongClicksRef = useRef(0)
  const totalResponseTimeRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  const spawnIndexRef = useRef(0)
  const previousZoneIdRef = useRef<number | null>(null)
  const zoneUseCountsRef = useRef(createZoneUseCounts())

  const [gameState, setGameState] = useState<GameState>('ready')
  const [targets, setTargets] = useState<MovingTarget[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  const accuracy = calculateAccuracy(hits, misses, wrongClicks)

  const averageResponseTime = calculateAverageResponseTime(
    totalResponseTimeRef.current,
    hits,
  )

  const currentDifficulty = useMemo(() => getDifficulty(hits), [hits])

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
      const isExpired =
        correctTarget !== undefined &&
        now - correctTarget.bornAt >= correctTarget.lifetime

      if (isExpired) {
        addMiss()
        spawnTargets(hitsRef.current, now)
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

  function getPlayAreaBounds(): Bounds {
    const width = areaRef.current?.clientWidth ?? PLAY_AREA_DEFAULT_WIDTH
    const height = areaRef.current?.clientHeight ?? PLAY_AREA_DEFAULT_HEIGHT

    return {
      width: Math.max(width, PLAY_AREA_MIN_WIDTH),
      height: Math.max(height, PLAY_AREA_MIN_HEIGHT),
    }
  }

  function resetStats() {
    hitsRef.current = 0
    missesRef.current = 0
    wrongClicksRef.current = 0
    totalResponseTimeRef.current = 0
    startTimeRef.current = null
    targetsRef.current = []

    spawnIndexRef.current = 0
    previousZoneIdRef.current = null
    zoneUseCountsRef.current = createZoneUseCounts()

    setHits(0)
    setMisses(0)
    setWrongClicks(0)
    setElapsedMs(0)
    setTargets([])
  }

  function startGame() {
    resetStats()

    const now = performance.now()

    startTimeRef.current = now
    gameStateRef.current = 'running'

    setGameState('running')
    spawnTargets(0, now)
  }

  function stopGame() {
    resetStats()

    gameStateRef.current = 'ready'
    setGameState('ready')
  }

  function finishGame(now = performance.now()) {
    gameStateRef.current = 'finished'
    targetsRef.current = []

    setTargets([])
    setElapsedMs(startTimeRef.current === null ? 0 : now - startTimeRef.current)
    setGameState('finished')
  }

  function spawnTargets(currentHits: number, now = performance.now()) {
    const bounds = getPlayAreaBounds()
    const difficulty = getDifficulty(currentHits)

    const nextTargets = createTargets({
      difficulty,
      bounds,
      now,
      spawnIndex: spawnIndexRef.current,
      previousZoneId: previousZoneIdRef.current,
      zoneUseCounts: zoneUseCountsRef.current,
    })

    spawnIndexRef.current += 1

    const correctTarget = nextTargets.find((target) => target.isCorrect)

    if (correctTarget) {
      previousZoneIdRef.current = correctTarget.zoneId
      zoneUseCountsRef.current[correctTarget.zoneId] += 1
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

  function handleAreaClick() {
    if (gameStateRef.current !== 'running') {
      return
    }

    addMiss()
  }

  function handleTargetClick(target: MovingTarget) {
    if (gameStateRef.current !== 'running') {
      return
    }

    const now = performance.now()

    if (!target.isCorrect) {
      addWrongClick()
      return
    }

    const nextHits = hitsRef.current + 1

    hitsRef.current = nextHits
    totalResponseTimeRef.current += now - target.bornAt

    setHits(nextHits)

    if (nextHits >= TOTAL_TARGETS) {
      finishGame(now)
      return
    }

    spawnTargets(nextHits, now)
  }

  return {
    gameState,
    targets,
    hits,
    misses,
    wrongClicks,
    elapsedMs,
    accuracy,
    averageResponseTime,
    currentDifficulty,
    startGame,
    stopGame,
    handleAreaClick,
    handleTargetClick,
  }
}