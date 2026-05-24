// ค่าคงที่และการตั้งค่าหลักของเกม Number Search
// ค่าเหล่านี้ควบคุมจำนวนเลเวล จำนวนตัวเลข และขนาดกระดาน
export const MAX_NUMBER_SEARCH_LEVEL = 10

export const BASE_NUMBER_POOL = 5
export const NUMBER_POOL_STEP = 5
export const BASE_PLAY_COUNT = 4

export const NUMBER_SEARCH_GAME_ID = 'number-search'
export const NUMBER_SEARCH_GAME_MODE = 'standard'
export const NUMBER_SEARCH_RESULT_SCHEMA_VERSION = 1

export const NUMBER_SEARCH_TIMER_INTERVAL_MS = 100
export const NUMBER_SEARCH_RESULT_DECIMAL_PLACES = 2

export const PERCENT_SCALE = 100
export const MILLISECONDS_PER_SECOND = 1000
export const SECONDS_PER_MINUTE = 60

export const TILE_SIZE = 56

export const BOARD_MIN_WIDTH = 320
export const BOARD_DEFAULT_WIDTH = 900
export const BOARD_MIN_HEIGHT = 520
export const BOARD_DEFAULT_HEIGHT = 520

export const TILE_PLACEMENT_MARGIN_X_PX = 56
export const TILE_PLACEMENT_MARGIN_Y_PX = 64

export const TILE_MIN_DISTANCE_PX = 150
export const TILE_MIN_DISTANCE_FALLBACK_PX = 110

export const TILE_PLACEMENT_MAX_ATTEMPTS = 160

export type NumberSearchPathDistanceConfig = {
  enabled: boolean
  maxLayoutAttempts: number
  fallbackDistanceStepPx: number

  minTurnAngleDeg: number
  maxTurnAngleDeg: number

  relaxedMinTurnAngleDeg: number
  relaxedMaxTurnAngleDeg: number

  directionSectorCount: number
  angleSweepCount: number

  levelPathDistancesPx: Record<number, number[]>
}

export const NUMBER_SEARCH_PATH_DISTANCE_CONFIG: NumberSearchPathDistanceConfig =
  {
    enabled: true,

    maxLayoutAttempts: 160,
    fallbackDistanceStepPx: 4,

    minTurnAngleDeg: 50,
    maxTurnAngleDeg: 170,

    relaxedMinTurnAngleDeg: 30,
    relaxedMaxTurnAngleDeg: 175,

    directionSectorCount: 16,
    angleSweepCount: 96,

    levelPathDistancesPx: {
      1: [240, 180, 240, 200, 260],
      2: [240, 180, 240, 200, 260, 220],
      3: [240, 180, 240, 200, 260, 220, 280],
      4: [240, 180, 240, 200, 260, 220, 280, 240],
      5: [240, 180, 240, 200, 260, 220, 280, 240, 300],
      6: [240, 180, 240, 200, 260, 220, 280, 240, 300, 260],
      7: [240, 180, 240, 200, 260, 220, 280, 240, 300, 260, 320],
      8: [240, 180, 240, 200, 260, 220, 280, 240, 300, 260, 320, 280],
      9: [240, 180, 240, 200, 260, 220, 280, 240, 300, 260, 320, 280, 340],
      10:[240, 180, 240, 200, 260, 220, 280, 240, 300, 260, 320, 280, 340, 300,],
    },
  }

export const NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG = {
  relaxedMinDistancesPx: [100, 80, 60],

  defaultPathDistancePx: 240,
  generatedPathDistanceStepPx: 20,

  allowScatteredFallback: false,
}

export const NUMBER_SEARCH_SCORE_CONFIG = {
  correctClickPoints: 100,
  completedLevelBonus: 500,
  wrongClickPenalty: 300,

  enableTimeBonus: false,

  targetAverageFindTimeMs: 800,
  timeBonusStepMs: 100,
  timeBonusPer100MsFaster: 50,
  maxTimeBonus: 2000,

  minScore: 0,
}

export const NUMBER_SEARCH_DEBUG_CONFIG = {
  enablePlacementDistanceLog: false,
}