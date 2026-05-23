import {
  CORRECT_TARGET_SPEED_MULTIPLIER,
  DECOY_MIN_SIZE,
  DECOY_MOVE_DURATION_MULTIPLIER,
  DECOY_SIZE_RATIO,
  DECOY_SPEED_MULTIPLIER,
  MIN_TARGET_SIZE,
  TARGET_SAFETY_LIFETIME_EXTRA_MS,
  TARGET_SAFETY_LIFETIME_MULTIPLIER,
} from '../config'
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
    plannedSpawnDistance: distancePlan.spawnDistance,
    actualSpawnDistance: correctSpawnResult.actualDistance,
  })

  const targets: MovingTarget[] = [correctTarget]

  for (let decoyIndex = 0; decoyIndex < difficulty.decoyCount; decoyIndex += 1) {
    const decoySize = Math.max(difficulty.size * DECOY_SIZE_RATIO, DECOY_MIN_SIZE)

    const decoyPoint = createDecoyPoint({
      correctPoint: correctSpawnResult.point,
      bounds,
      targetSize: decoySize,
      decoyIndex,
    })

    targets.push(
      createTarget({
        id: `decoy-${spawnIndex}-${decoyIndex}`,
        position: decoyPoint,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: decoySize,
          moveDurationMs:
            difficulty.moveDurationMs * DECOY_MOVE_DURATION_MULTIPLIER,
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

  const baseSpeed =
    distancePlan.movementStepDistance / Math.max(difficulty.moveDurationMs, 1)

  const speedMultiplier = isCorrect
    ? CORRECT_TARGET_SPEED_MULTIPLIER
    : DECOY_SPEED_MULTIPLIER

  const speed = baseSpeed * speedMultiplier

  const movementDuration = distancePlan.movementStepDistance / speed
  const safetyLifetime = Math.ceil(
    movementDuration * TARGET_SAFETY_LIFETIME_MULTIPLIER +
      TARGET_SAFETY_LIFETIME_EXTRA_MS,
  )

  return {
    id,

    targetIndex: distancePlan.targetIndex,
    targetNumber: distancePlan.targetNumber,
    stageTargetIndex: distancePlan.stageTargetIndex,

    x: position.x,
    y: position.y,

    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,

    size: Math.max(difficulty.size, MIN_TARGET_SIZE),

    bornAt: now,
    lifetime: Math.max(difficulty.lifetime, safetyLifetime),

    isCorrect,
    pattern: difficulty.pattern,

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