import type {
  Bounds,
  Difficulty,
  MovingTarget,
  Point,
  TargetDistancePlan,
} from '../types'
import {
  createDecoyPoint,
  createInitialSpawnPoint,
  createSpawnPoint,
} from './spawnPlanner'

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
  const correctSpawnResult =
    previousPoint === null
      ? createInitialSpawnPoint(bounds, difficulty.size)
      : createSpawnPoint({
          previousPoint,
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
    plannedSpawnDistance:
      previousPoint === null ? 0 : distancePlan.spawnDistance,
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
          speed: difficulty.speed * 0.85,
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
  const speedMultiplier = isCorrect ? 1 : 0.8
  const speed = difficulty.speed * speedMultiplier

  return {
    id,

    x: position.x,
    y: position.y,

    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,

    size: Math.max(difficulty.size, 28),

    bornAt: now,
    lifetime: difficulty.lifetime,

    isCorrect,
    pattern: difficulty.pattern,

    anchorX: position.x,
    anchorY: position.y,

    movementStepDistance: distancePlan.movementStepDistance,
    remainingMoveDistance: distancePlan.movementStepDistance,

    plannedSpawnDistance,
    actualSpawnDistance,

    stageIndex: distancePlan.stageIndex,
    mode: difficulty.mode,
  }
}