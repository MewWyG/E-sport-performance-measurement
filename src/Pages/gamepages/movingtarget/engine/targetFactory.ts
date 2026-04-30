import type { Bounds, Difficulty, MovingTarget } from '../types'
import { randomBetween } from '../utils/random'

export function createTargets(
  difficulty: Difficulty,
  bounds: Bounds,
  now: number,
): MovingTarget[] {
  const targets: MovingTarget[] = [
    createTarget({
      id: `correct-${now}`,
      isCorrect: true,
      difficulty,
      bounds,
      now,
    }),
  ]

  for (let i = 0; i < difficulty.decoyCount; i += 1) {
    targets.push(
      createTarget({
        id: `decoy-${i}-${now}`,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: Math.max(difficulty.size * 0.9, 28),
          speed: difficulty.speed * 0.85,
        },
        bounds,
        now,
      }),
    )
  }

  return targets
}

type CreateTargetParams = {
  id: string
  isCorrect: boolean
  difficulty: Difficulty
  bounds: Bounds
  now: number
}

function createTarget({
  id,
  isCorrect,
  difficulty,
  bounds,
  now,
}: CreateTargetParams): MovingTarget {
  const safeSize = Math.max(difficulty.size, 28)
  const halfSize = safeSize / 2

  const x = randomBetween(halfSize + 8, bounds.width - halfSize - 8)
  const y = randomBetween(halfSize + 8, bounds.height - halfSize - 8)

  const angle = Math.random() * Math.PI * 2
  const speedMultiplier = isCorrect ? 1 : 0.8
  const speed = difficulty.speed * speedMultiplier

  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: safeSize,
    bornAt: now,
    lifetime: difficulty.lifetime,
    isCorrect,
    pattern: difficulty.pattern,
    nextTurnAt: now + randomBetween(450, 850),
  }
}