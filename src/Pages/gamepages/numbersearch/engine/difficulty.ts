import {
  BASE_NUMBER_POOL,
  BASE_PLAY_COUNT,
  NUMBER_POOL_STEP,
} from '../config'
import type { LevelConfig } from '../types'

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(level, 1)

  return {
    level: safeLevel,
    numberPoolMax: BASE_NUMBER_POOL + NUMBER_POOL_STEP * safeLevel,
    playCount: BASE_PLAY_COUNT + safeLevel,
  }
}