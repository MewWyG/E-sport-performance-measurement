import type {
  Bounds,
  Difficulty,
  MovingTarget,
  Point,
  TargetDistancePlan,
} from '../types'
import { createDecoyPoint, createSpawnPoint } from './spawnPlanner'

type CreateTargetsParams = {
  difficulty: Difficulty
  bounds: Bounds
  now: number
  spawnIndex: number
  previousPoint: Point | null
  distancePlan: TargetDistancePlan
}

export function createTargets({
  difficulty,
  bounds,
  now,
  spawnIndex,
  previousPoint,
  distancePlan,
}: CreateTargetsParams): MovingTarget[] {
  /**
   * ถ้าเป็นเป้าแรก previousPoint จะยังไม่มี
   * ดังนั้นให้ใช้จุดกลางสนามเป็นจุดอ้างอิงเริ่มต้น
   *
   * ผลลัพธ์:
   * - เป้า 1 ใช้ spawnDistance จากจุดกลางสนาม → จุดเกิดเป้า 1
   * - เป้า 2 ใช้ spawnDistance จากจุดเกิดเป้า 1 → จุดเกิดเป้า 2
   * - เป้า 3 ใช้ spawnDistance จากจุดเกิดเป้า 2 → จุดเกิดเป้า 3
   */
  const spawnBasePoint = previousPoint ?? getCenterPoint(bounds)

  const correctSpawnResult = createSpawnPoint({
    previousPoint: spawnBasePoint,
    bounds,
    targetSize: difficulty.size,
    plannedDistance: distancePlan.spawnDistance,
  })

  const correctTarget = createTarget({
    id: `correct-${spawnIndex}`,
    position: correctSpawnResult.point,
    isCorrect: true,
    difficulty,
    now,
    distancePlan,

    /**
     * ตอนนี้เป้าทุกตัวใช้ spawnDistance จริงแล้ว
     * รวมถึงเป้าแรกที่ใช้จุดกลางสนามเป็นฐาน
     */
    plannedSpawnDistance: distancePlan.spawnDistance,
    actualSpawnDistance: correctSpawnResult.actualDistance,
  })

  const targets: MovingTarget[] = [correctTarget]

  for (let i = 0; i < difficulty.decoyCount; i += 1) {
    const decoySize = Math.max(difficulty.size * 0.9, 28)

    const decoyPoint = createDecoyPoint({
      correctPoint: correctSpawnResult.point,
      bounds,
      targetSize: decoySize,
      decoyIndex: i,
    })

    targets.push(
      createTarget({
        id: `decoy-${spawnIndex}-${i}`,
        position: decoyPoint,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: decoySize,
          moveDurationMs: difficulty.moveDurationMs * 1.1,
        },
        now,
        distancePlan,
        plannedSpawnDistance: 0,
        actualSpawnDistance: 0,
      }),
    )
  }

  return targets
}

type CreateTargetParams = {
  id: string
  position: Point
  isCorrect: boolean
  difficulty: Difficulty
  now: number
  distancePlan: TargetDistancePlan
  plannedSpawnDistance: number
  actualSpawnDistance: number
}

function createTarget({
  id,
  position,
  isCorrect,
  difficulty,
  now,
  distancePlan,
  plannedSpawnDistance,
  actualSpawnDistance,
}: CreateTargetParams): MovingTarget {
  const angle = Math.random() * Math.PI * 2

  /**
   * ความเร็วจริงของเป้า:
   * ระยะที่เป้าต้องเคลื่อนที่ / เวลาที่โหมดกำหนด
   *
   * เช่น:
   * movementStepDistance = 60px
   * moveDurationMs = 850ms
   * speed = 60 / 850 px/ms
   */
  const baseSpeed =
    distancePlan.movementStepDistance / Math.max(difficulty.moveDurationMs, 1)

  const speedMultiplier = isCorrect ? 1 : 0.85
  const speed = baseSpeed * speedMultiplier

  /**
   * lifetime ใช้เป็น safety timeout เท่านั้น
   * gameplay หลักจะจบเป้าเมื่อ remainingMoveDistance หมด
   */
  const movementDuration = distancePlan.movementStepDistance / speed
  const safetyLifetime = Math.ceil(movementDuration * 2 + 1000)

  return {
    id,

    targetIndex: distancePlan.targetIndex,
    targetNumber: distancePlan.targetNumber,
    stageTargetIndex: distancePlan.stageTargetIndex,

    x: position.x,
    y: position.y,

    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,

    size: Math.max(difficulty.size, 28),

    bornAt: now,
    lifetime: Math.max(difficulty.lifetime, safetyLifetime),

    isCorrect,
    pattern: difficulty.pattern,

    /**
     * จุดเกิดของเป้านี้
     * useMovingTargetGame จะเก็บค่านี้ไว้เป็น previousPoint
     * เพื่อคำนวณจุดเกิดของเป้าถัดไป
     */
    spawnX: position.x,
    spawnY: position.y,

    movementStepDistance: distancePlan.movementStepDistance,
    remainingMoveDistance: distancePlan.movementStepDistance,
    hasCompletedMovement: false,

    plannedSpawnDistance,
    actualSpawnDistance,

    stageIndex: distancePlan.stageIndex,
    mode: difficulty.mode,
  }
}

function getCenterPoint(bounds: Bounds): Point {
  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
  }
}