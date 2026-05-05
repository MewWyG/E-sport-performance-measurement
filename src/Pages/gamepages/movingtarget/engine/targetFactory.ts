import type { Bounds, Difficulty, MovingTarget, Point } from '../types'
import { randomBetween } from '../utils/random'
import {
  isFarEnoughFromCorrectTarget,
  pickDecoyZones,
  pickNextTargetZone,
  pickPointInZone,
} from './spawnZones'

type CreateTargetsParams = {
  difficulty: Difficulty
  bounds: Bounds
  now: number
  spawnIndex: number
  previousZoneId: number | null
  zoneUseCounts: number[]
}

export function createTargets({
  difficulty,
  bounds,
  now,
  spawnIndex,
  previousZoneId,
  zoneUseCounts,
}: CreateTargetsParams): MovingTarget[] {
  const correctZoneId = pickNextTargetZone(previousZoneId, zoneUseCounts)

  const correctPosition = pickPointInZone(
    bounds,
    difficulty.size,
    correctZoneId,
  )

  const targets: MovingTarget[] = [
    createTarget({
      id: `correct-${spawnIndex}`,
      position: correctPosition,
      zoneId: correctZoneId,
      isCorrect: true,
      difficulty,
      now,
    }),
  ]

  const decoyZones = pickDecoyZones(
    correctZoneId,
    difficulty.decoyCount,
    zoneUseCounts,
  )

  for (let i = 0; i < difficulty.decoyCount; i += 1) {
    const decoySize = Math.max(difficulty.size * 0.9, 28)
    const decoyZoneId = decoyZones[i]

    let decoyPosition = pickPointInZone(bounds, decoySize, decoyZoneId)
    let attempt = 0

    while (
      !isFarEnoughFromCorrectTarget(decoyPosition, correctPosition) &&
      attempt < 20
    ) {
      decoyPosition = pickPointInZone(bounds, decoySize, decoyZoneId)
      attempt += 1
    }

    targets.push(
      createTarget({
        id: `decoy-${spawnIndex}-${i}`,
        position: decoyPosition,
        zoneId: decoyZoneId,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: decoySize,
          speed: difficulty.speed * 0.85,
        },
        now,
      }),
    )
  }

  return targets
}

type CreateTargetParams = {
  id: string
  position: Point
  zoneId: number
  isCorrect: boolean
  difficulty: Difficulty
  now: number
}

function createTarget({
  id,
  position,
  zoneId,
  isCorrect,
  difficulty,
  now,
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
    nextTurnAt: now + randomBetween(450, 850),
    zoneId,
  }
}