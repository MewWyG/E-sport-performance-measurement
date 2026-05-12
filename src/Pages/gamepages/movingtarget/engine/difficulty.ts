import { GAME_MODE_CONFIG, MIN_TARGET_SIZE } from '../config'
import type { Difficulty, GameMode } from '../types'

export function getDifficulty(
  _spawnedCount: number,
  mode: GameMode,
): Difficulty {
  const modeConfig = GAME_MODE_CONFIG[mode]

  return {
    size: Math.max(modeConfig.targetSize, MIN_TARGET_SIZE),
    speed: modeConfig.targetSpeed,
    lifetime: modeConfig.targetLifetime,
    decoyCount: modeConfig.decoyCount,
    pattern: 'controlled',
    label: modeConfig.label,
    mode,
  }
}