export const MAX_NUMBER_SEARCH_LEVEL = 10

export const BASE_NUMBER_POOL = 5
export const NUMBER_POOL_STEP = 5
export const BASE_PLAY_COUNT = 4

export const TILE_SIZE = 56

export const BOARD_MIN_WIDTH = 320
export const BOARD_DEFAULT_WIDTH = 900
export const BOARD_MIN_HEIGHT = 520
export const BOARD_DEFAULT_HEIGHT = 520

// กันตัวเลขชิดขอบสนาม
export const TILE_PLACEMENT_MARGIN_X_PX = 56
export const TILE_PLACEMENT_MARGIN_Y_PX = 64

// ระยะห่างขั้นต่ำระหว่างจุดศูนย์กลางของตัวเลข
export const TILE_MIN_DISTANCE_PX = 150
export const TILE_MIN_DISTANCE_FALLBACK_PX = 110

// จำนวนครั้งที่ลองสุ่มตำแหน่งใน scattered fallback
export const TILE_PLACEMENT_MAX_ATTEMPTS = 160

export type NumberSearchPathDistanceConfig = {
  enabled: boolean
  maxLayoutAttempts: number
  fallbackDistanceStepPx: number
  minTurnAngleDeg: number
  maxTurnAngleDeg: number
  directionSectorCount: number
  angleSweepCount: number
  levelPathDistancesPx: Record<number, number[]>
}

// คุมระยะการวางตัวเลขตามลำดับการกด
export const NUMBER_SEARCH_PATH_DISTANCE_CONFIG: NumberSearchPathDistanceConfig =
  {
    enabled: true,

    maxLayoutAttempts: 160,
    fallbackDistanceStepPx: 4,

    // กันไม่ให้ตัวเลขเรียงเป็นเส้นตรงเกินไป
    minTurnAngleDeg: 50,
    maxTurnAngleDeg: 170,

    // จำนวนทิศที่ใช้ตรวจว่าไปทางไหนได้บ้าง
    directionSectorCount: 16,

    // ใช้กวาดมุมละเอียดขึ้น ถ้าวางด้วย directionSectorCount ไม่ได้
    angleSweepCount: 96,

    // ค่าแรก = center → เลขแรก, ค่าถัดไป = เลขก่อนหน้า → เลขถัดไป
    levelPathDistancesPx: {
      1: [240, 180, 240, 200, 260],
      2: [240, 180, 240, 200, 260, 220],
      3: [240, 180, 240, 200, 260, 220, 280],
      4: [240, 180, 240, 200, 260, 220, 280, 240],
      5: [240, 180, 240, 200, 260, 220, 280, 240, 300],
      6: [240, 180, 240, 200, 260, 220, 280, 240, 300, 260],
      7: [
        240,
        180,
        240,
        200,
        260,
        220,
        280,
        240,
        300,
        260,
        320,
      ],
      8: [
        240,
        180,
        240,
        200,
        260,
        220,
        280,
        240,
        300,
        260,
        320,
        280,
      ],
      9: [
        240,
        180,
        240,
        200,
        260,
        220,
        280,
        240,
        300,
        260,
        320,
        280,
        340,
      ],
      10: [
        240,
        180,
        240,
        200,
        260,
        220,
        280,
        240,
        300,
        260,
        320,
        280,
        340,
        300,
      ],
    },
  }

export const NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG = {
  // ใช้ตอน strict layout วางไม่ได้
  relaxedMinDistancesPx: [100, 80, 60],

  // ใช้ตอน config ของ level ใส่ระยะไม่ครบ
  defaultPathDistancePx: 240,
  generatedPathDistanceStepPx: 20,

  // false = ถ้าวาง controlled path ไม่ได้ จะ error เพื่อไม่ให้ระยะหลุด config
  allowScatteredFallback: false,
}

export const NUMBER_SEARCH_SCORE_CONFIG = {
  // คะแนนต่อเลขที่กดถูก
  correctClickPoints: 100,

  // โบนัสเมื่อผ่านแต่ละ Level แล้วเท่านั้น
  completedLevelBonus: 500,

  // คะแนนที่หักต่อการกดผิด 1 ครั้ง
  wrongClickPenalty: 300,

  // เปิด/ปิดโบนัสจากความเร็ว
  enableTimeBonus: true,

  // เวลาเฉลี่ยเป้าหมายต่อเลข
  targetAverageFindTimeMs: 800,

  // เร็วกว่าเป้าหมายทุก 100ms ได้โบนัสเท่านี้
  timeBonusPer100MsFaster: 50,

  // จำกัดโบนัสเวลาสูงสุด
  maxTimeBonus: 2000,

  // คะแนนต่ำสุด
  minScore: 0,
}