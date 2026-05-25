import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  MAX_FRAME_DELTA_MS,
  PLAY_AREA_DEFAULT_HEIGHT,
  PLAY_AREA_DEFAULT_WIDTH,
  PLAY_AREA_MIN_HEIGHT,
  PLAY_AREA_MIN_WIDTH,
  RESULT_DECIMAL_PLACES,
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

// hook หลักของเกม Moving Target
// ควบคุมสถานะเกม การ spawn targets การบันทึก stat และการจัดการ input
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

  // อัปเดตตำแหน่งเป้าในทุกเฟรมเมื่อเกมกำลังเล่นอยู่
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

      const deltaMs = Math.min(now - lastFrameTime, MAX_FRAME_DELTA_MS)
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

  // เปลี่ยนโหมดเกมเมื่อเกมยังไม่ได้เริ่มเล่น
  function setSelectedMode(mode: GameMode) {
    if (gameStateRef.current === 'running') {
      return
    }

    selectedModeRef.current = mode
    setSelectedModeState(mode)
  }

  // คืนขนาดของสนามเล่นตาม DOM element หรือค่า default เมื่อยังไม่สามารถวัดได้
  function getPlayAreaBounds(): Bounds {
    const rect = areaRef.current?.getBoundingClientRect()

    const width = rect?.width ?? PLAY_AREA_DEFAULT_WIDTH
    const height = rect?.height ?? PLAY_AREA_DEFAULT_HEIGHT

    return {
      width: Math.max(width, PLAY_AREA_MIN_WIDTH),
      height: Math.max(height, PLAY_AREA_MIN_HEIGHT),
    }
  }

  // คืนเวลาเล่นเกมตั้งแต่เริ่มต้นจนถึงตอนนี้
  function getGameTime(now = performance.now()) {
    return startTimeRef.current === null
      ? 0
      : Math.round(now - startTimeRef.current)
  }

  // รีเซ็ต stat และ state ทั้งหมดเพื่อเตรียมเริ่มเกมใหม่
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

  // เริ่มเกม โดยรีเซ็ตสถิติและ spawn target แรก
  function startGame() {
    const mode = selectedModeRef.current

    resetStats(mode)

    const now = performance.now()

    startTimeRef.current = now
    gameStateRef.current = 'running'

    setGameState('running')
    spawnTargets(now)
  }

  // หยุดเกมและเปลี่ยนสถานะเป็น finished
  function stopGame() {
    finishGame()
  }

  // จบเกมทันที และเคลียร์เป้าออกจากสนาม
  function finishGame(now = performance.now()) {
    gameStateRef.current = 'finished'
    targetsRef.current = []

    setTargets([])

    const startTime = startTimeRef.current

    if (startTime !== null) {
      setElapsedMs(now - startTime)
    }

    setGameState('finished')
  }

  // สร้าง targets ใหม่ตามระยะทางและโหมดเกม
  function spawnTargets(now: number) {
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

  // เพิ่มจำนวน miss เมื่อผู้เล่นคลิกผิดหรือเป้าหมดเวลา
  function addMiss() {
    const nextMisses = missesRef.current + 1

    missesRef.current = nextMisses
    setMisses(nextMisses)
  }

  // เพิ่มจำนวน wrong click เมื่อผู้เล่นกดเป้าหลอก
  function addWrongClick() {
    const nextWrongClicks = wrongClicksRef.current + 1

    wrongClicksRef.current = nextWrongClicks
    setWrongClicks(nextWrongClicks)
  }

  // บันทึกเหตุการณ์เป้าหมายเมื่อถูกยิงหรือพลาด
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
      remainingMoveDistance: Number(
        target.remainingMoveDistance.toFixed(RESULT_DECIMAL_PLACES),
      ),

      plannedSpawnDistance: target.plannedSpawnDistance,
      actualSpawnDistance: Number(
        target.actualSpawnDistance.toFixed(RESULT_DECIMAL_PLACES),
      ),

      spawnX: Number(target.spawnX.toFixed(RESULT_DECIMAL_PLACES)),
      spawnY: Number(target.spawnY.toFixed(RESULT_DECIMAL_PLACES)),

      finalX: Number(target.x.toFixed(RESULT_DECIMAL_PLACES)),
      finalY: Number(target.y.toFixed(RESULT_DECIMAL_PLACES)),

      targetSize: target.size,
      targetLifetime: target.lifetime,

      createdAtMs: Math.round(target.bornAt - startTime),
      completedAtMs: Math.round(now - startTime),
    }

    targetEventsRef.current = [...targetEventsRef.current, event]
    setTargetEvents(targetEventsRef.current)
  }

  // บันทึกเหตุการณ์ input เมื่อผู้เล่นคลิกพื้นที่ว่าง
  function recordInputEvent(event: MovingTargetInputEvent) {
    inputEventsRef.current = [...inputEventsRef.current, event]
    setInputEvents(inputEventsRef.current)
  }

  // จัดการคลิกในสนามเล่นเมื่อผู้เล่นไม่โดนเป้า
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

  // จัดการคลิกที่เป้าหมาย วิเคราะห์ว่าเป็นเป้าจริงหรือเป้าหลอก
  function handleTargetClick(target: MovingTarget) {
    if (gameStateRef.current !== 'running') {
      return
    }

  const now = performance.now()
  const activeTarget = targetsRef.current.find((item) => item.id === target.id)

  if (!activeTarget) {
    return
  }

  if (!activeTarget.isCorrect) {
    addWrongClick()

    const correctTarget = targetsRef.current.find((item) => item.isCorrect)

    recordInputEvent({
      eventType: 'wrong_target_click',
      gameTimeMs: getGameTime(now),
      targetNumber: correctTarget?.targetNumber ?? null,
      targetId: activeTarget.id,
    })

    return
  }

  const nextHits = hitsRef.current + 1

  hitsRef.current = nextHits
  totalResponseTimeRef.current += now - activeTarget.bornAt

  setHits(nextHits)

  recordTargetEvent({
    target: activeTarget,
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

    setSelectedMode,
    startGame,
    stopGame,
    handleAreaClick,
    handleTargetClick,
  }
}