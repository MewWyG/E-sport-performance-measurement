import {
  GAME_MODE_CONFIG,
  MIN_TARGET_SIZE,
  TARGET_SAFETY_LIFETIME_EXTRA_MS,
  TARGET_SAFETY_LIFETIME_MULTIPLIER,
} from '../config'
import type { Difficulty, GameMode } from '../types'

// แปลงโหมดเป็น difficulty object ที่ใช้สร้าง targets
export function getDifficulty(
  _spawnedCount: number,
  mode: GameMode,
): Difficulty {
  const modeConfig = GAME_MODE_CONFIG[mode]

  return {
    size: Math.max(modeConfig.targetSize, MIN_TARGET_SIZE),

    // ความเร็วจริงคำนวณจาก movementStepDistance / moveDurationMs
    speed: 0,

    moveDurationMs: modeConfig.targetMoveDurationMs,

    // safety timeout เท่านั้น ไม่ใช่อายุหลักของเป้า
    lifetime: Math.round(
      modeConfig.targetMoveDurationMs * TARGET_SAFETY_LIFETIME_MULTIPLIER +
        TARGET_SAFETY_LIFETIME_EXTRA_MS,
    ),

    decoyCount: modeConfig.decoyCount,
    pattern: 'controlled',
    label: modeConfig.label,
    mode,
  }
}