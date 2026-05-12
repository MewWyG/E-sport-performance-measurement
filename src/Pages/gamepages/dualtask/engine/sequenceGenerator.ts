import { AVAILABLE_KEYS, DUAL_TASK_CONFIG } from '../constants'
import type { DualTaskConfig } from '../constants'
import type { KeySequence } from '../types'
import type { Rng } from './rng'
import { randomInt } from './rng'

export function generateKeySequence(
  now: number,
  rng: Rng,
  sequenceCount: number,
  config: DualTaskConfig = DUAL_TASK_CONFIG,
): KeySequence {
  const difficultyBonus = Math.floor(sequenceCount / 5)

  const sequenceLength = Math.min(
    config.maxSequenceLength,
    config.minSequenceLength + difficultyBonus,
  )

  const keys = Array.from({ length: sequenceLength }, () => {
    const index = randomInt(rng, 0, AVAILABLE_KEYS.length - 1)
    return AVAILABLE_KEYS[index]
  })

  return {
    id: `${Math.floor(now)}-${sequenceCount}`,
    keys,
    currentIndex: 0,
    startedAt: now,
    expiresAt: now + config.sequenceLifetimeMs,
  }
}