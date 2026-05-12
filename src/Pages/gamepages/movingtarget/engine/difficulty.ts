import { GAME_MODE_CONFIG, MIN_TARGET_SIZE } from '../config'
import type { Difficulty, GameMode } from '../types'

export function getDifficulty(
  _spawnedCount: number,
  mode: GameMode,
): Difficulty {
  const modeConfig = GAME_MODE_CONFIG[mode]

  return {
    size: Math.max(modeConfig.targetSize, MIN_TARGET_SIZE),

    // ความเร็วจริงคำนวณใน targetFactory จาก movementStepDistance / moveDurationMs
    speed: 0,

    moveDurationMs: modeConfig.targetMoveDurationMs,

    // safety timeout เท่านั้น ไม่ใช่อายุหลักของเป้า
    lifetime: Math.round(modeConfig.targetMoveDurationMs * 2 + 1000),

    decoyCount: modeConfig.decoyCount,
    pattern: 'controlled',
    label: modeConfig.label,
    mode,
  }
}