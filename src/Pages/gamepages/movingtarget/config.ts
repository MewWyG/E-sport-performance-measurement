import type { GameMode } from './types'

export const TOTAL_TARGETS = 50
export const TARGETS_PER_STAGE = 10
export const TOTAL_STAGES = TOTAL_TARGETS / TARGETS_PER_STAGE

export const PLAY_AREA_MIN_WIDTH = 320
export const PLAY_AREA_MIN_HEIGHT = 360

export const PLAY_AREA_DEFAULT_WIDTH = 900
export const PLAY_AREA_DEFAULT_HEIGHT = 520

export const SPAWN_MARGIN = 48
export const DECOY_MIN_DISTANCE = 96
export const SPAWN_POINT_MAX_ATTEMPTS = 24

// safe area สำหรับปุ่ม "จบเกม"
export const STOP_BUTTON_SAFE_AREA_TOP = 12
export const STOP_BUTTON_SAFE_AREA_RIGHT = 12
export const STOP_BUTTON_SAFE_AREA_WIDTH = 156
export const STOP_BUTTON_SAFE_AREA_HEIGHT = 72

export const TARGET_COLLISION_GAP = 10
export const TARGET_COLLISION_RESOLVE_PASSES = 3

// ใช้สร้างค่าระยะแบบ stage ละ 10 ค่า
export const DISTANCE_VALUE_STEP = 5

// ระยะรวมที่เป้าต้องเคลื่อนที่ให้ครบก่อนสุ่มทิศใหม่
export const MOVEMENT_STEP_DISTANCE_STAGE_START = 20

// ระยะห่างจากจุดเกิดของเป้าก่อนหน้า ไปยังจุดเกิดของเป้าถัดไป
export const SPAWN_DISTANCE_STAGE_START = 60

export const SPAWN_DISTANCE_TOLERANCE_RATIO = 0.15

export const MIN_TARGET_SIZE = 28

export type GameModeConfig = {
  label: string
  targetSize: number
  targetSpeed: number
  targetLifetime: number
  distanceMultiplier: number
  decoyCount: number
}

export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  easy: {
    label: 'Easy',
    targetSize: 76,
    targetSpeed: 0.1,
    targetLifetime: 2400,
    distanceMultiplier: 1,
    decoyCount: 0,
  },

  normal: {
    label: 'Normal',
    targetSize: 64,
    targetSpeed: 0.13,
    targetLifetime: 2100,
    distanceMultiplier: 1,
    decoyCount: 1,
  },

  hard: {
    label: 'Hard',
    targetSize: 52,
    targetSpeed: 0.16,
    targetLifetime: 1800,
    distanceMultiplier: 1,
    decoyCount: 2,
  },
}