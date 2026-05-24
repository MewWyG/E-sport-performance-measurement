import type { GameMode } from './types'

// ค่าคงที่สำหรับเกม Moving Target
// - TOTAL_TARGETS: จำนวนเป้าหมายจริงทั้งหมดที่ผู้เล่นต้องยิงให้ครบ
// - TARGETS_PER_STAGE: จำนวนเป้าในแต่ละกลุ่มย่อย (stage)
// - TOTAL_STAGES: จำนวนกลุ่มย่อยทั้งหมด
export const TOTAL_TARGETS = 50
export const TARGETS_PER_STAGE = 10
export const TOTAL_STAGES = TOTAL_TARGETS / TARGETS_PER_STAGE

export const MOVING_TARGET_GAME_ID = 'moving-target'
export const RESULT_PAYLOAD_SCHEMA_VERSION = 1

export const PLAY_AREA_MIN_WIDTH = 320
export const PLAY_AREA_MIN_HEIGHT = 360

export const PLAY_AREA_DEFAULT_WIDTH = 900
export const PLAY_AREA_DEFAULT_HEIGHT = 520

export const SPAWN_MARGIN = 48
export const DECOY_MIN_DISTANCE = 96

export const STOP_BUTTON_SAFE_AREA_TOP = 12
export const STOP_BUTTON_SAFE_AREA_RIGHT = 12
export const STOP_BUTTON_SAFE_AREA_WIDTH = 156
export const STOP_BUTTON_SAFE_AREA_HEIGHT = 72

export const TARGET_COLLISION_GAP = 10
export const TARGET_COLLISION_RESOLVE_PASSES = 3

export const TARGET_MAX_MOVEMENT_STEP_PX = 4
export const TARGET_MIN_DIRECTION_SPEED = 0.001
export const TARGET_MOVEMENT_MAX_GUARD_STEPS = 128
export const MAX_FRAME_DELTA_MS = 32

export const TARGET_SEPARATION_MIN_SPEED = 0.08
export const TARGET_SEPARATION_EPSILON = 0.001
export const TARGET_SEPARATION_FALLBACK_ANGLE_I_DEG = 37
export const TARGET_SEPARATION_FALLBACK_ANGLE_J_DEG = 53

export const DISTANCE_VALUE_STEP = 5

export const MOVEMENT_STEP_DISTANCE_STAGE_START = 20
export const SPAWN_DISTANCE_STAGE_START = 60

export const SPAWN_DISTANCE_TOLERANCE_RATIO = 0.15
export const DECOY_DISTANCE_STEP = 44
export const SPAWN_TOP_CANDIDATE_COUNT = 3
export const SPAWN_BALANCE_X_WEIGHT = 1.2
export const SPAWN_BALANCE_Y_WEIGHT = 0.8
export const FALLBACK_TO_CENTER_DISTANCE_RATIO = 0.85

export const MIN_TARGET_SIZE = 28

export const DECOY_SIZE_RATIO = 0.9
export const DECOY_MIN_SIZE = 28
export const DECOY_MOVE_DURATION_MULTIPLIER = 1.1
export const DECOY_SPEED_MULTIPLIER = 0.85
export const CORRECT_TARGET_SPEED_MULTIPLIER = 1

export const TARGET_SAFETY_LIFETIME_MULTIPLIER = 2
export const TARGET_SAFETY_LIFETIME_EXTRA_MS = 1000

export const RESULT_DECIMAL_PLACES = 2
export const PERCENT_SCALE = 100

export type GameModeConfig = {
  label: string
  targetSize: number

  // เวลาที่เป้าใช้เคลื่อนที่ครบ movementStepDistance
  targetMoveDurationMs: number

  distanceMultiplier: number
  decoyCount: number
}

export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  easy: {
    label: 'Easy',
    targetSize: 76,
    targetMoveDurationMs: 1100,
    distanceMultiplier: 1,
    decoyCount: 0,
  },

  normal: {
    label: 'Normal',
    targetSize: 64,
    targetMoveDurationMs: 850,
    distanceMultiplier: 1,
    decoyCount: 1,
  },

  hard: {
    label: 'Hard',
    targetSize: 52,
    targetMoveDurationMs: 650,
    distanceMultiplier: 1,
    decoyCount: 2,
  },
}