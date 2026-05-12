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

  /**
   * เก็บ “จุดเกิด” ของเป้าจริงตัวก่อนหน้า
   * ใช้เป็นฐานคำนวณตำแหน่งเกิดของเป้าถัดไป
   *
   * สำคัญ:
   * ไม่ใช้ตำแหน่งล่าสุดของเป้า เพราะผู้เล่นแต่ละคนคลิกเร็ว/ช้าไม่เท่ากัน
   */
  const previousTargetPointRef = useRef<Point | null>(null)

  const [gameState, setGameState] = useState<GameState>('ready')
  const [selectedMode, setSelectedModeState] = useState<GameMode>('normal')

  const [targets, setTargets] = useState<MovingTarget[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [spawnedTargetCount, setSpawnedTargetCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

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

      /**
       * เป้าจะถือว่าหมดอายุเมื่อ:
       * 1. เคลื่อนที่ครบ movementStepDistance แล้ว
       * 2. หรือเกิน lifetime ที่เป็น safety timeout
       *
       * ตอนนี้ gameplay หลักใช้ hasCompletedMovement เป็นตัวจบเป้า
       * ส่วน lifetime ใช้กัน bug เฉย ๆ
       */
      const isExpired =
        correctTarget !== undefined &&
        (correctTarget.hasCompletedMovement ||
          now - correctTarget.bornAt >= correctTarget.lifetime)

      if (isExpired) {
        addMiss()

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
    const width = areaRef.current?.clientWidth ?? PLAY_AREA_DEFAULT_WIDTH
    const height = areaRef.current?.clientHeight ?? PLAY_AREA_DEFAULT_HEIGHT

    return {
      width: Math.max(width, PLAY_AREA_MIN_WIDTH),
      height: Math.max(height, PLAY_AREA_MIN_HEIGHT),
    }
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
    distanceScheduleRef.current = createDistanceSchedule(mode)

    setHits(0)
    setMisses(0)
    setWrongClicks(0)
    setSpawnedTargetCount(0)
    setElapsedMs(0)
    setTargets([])
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
    resetStats()

    gameStateRef.current = 'ready'
    setGameState('ready')
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
      /**
       * ใช้จุดเกิดของเป้า ไม่ใช้ตำแหน่งล่าสุด
       * เพื่อให้เป้าถัดไปไม่ขึ้นกับผู้เล่นคลิกเร็วหรือช้า
       */
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

    startGame,
    stopGame,
    setSelectedMode,
    handleAreaClick,
    handleTargetClick,
  }
}