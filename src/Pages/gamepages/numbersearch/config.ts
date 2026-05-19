export const MAX_NUMBER_SEARCH_LEVEL = 10

export const BASE_NUMBER_POOL = 5
export const NUMBER_POOL_STEP = 5
export const BASE_PLAY_COUNT = 4

export const TILE_SIZE = 56

export const BOARD_MIN_WIDTH = 320
export const BOARD_DEFAULT_WIDTH = 900
export const BOARD_MIN_HEIGHT = 520
export const BOARD_DEFAULT_HEIGHT = 520

/**
 * ระยะขอบของพื้นที่วางตัวเลข หน่วยเป็น px
 */
export const TILE_PLACEMENT_MARGIN_X_PX = 56
export const TILE_PLACEMENT_MARGIN_Y_PX = 64

/**
 * ระยะห่างขั้นต่ำระหว่างตัวเลขทุกตัว หน่วยเป็น px
 *
 * ค่านี้เป็นระยะระหว่างจุดศูนย์กลางของ tile
 * เพิ่มค่านี้เพื่อไม่ให้เลขดูติดกันหรือรวมกลุ่มเกินไป
 */
export const TILE_MIN_DISTANCE_PX = 150

/**
 * ระยะห่างขั้นต่ำสำรอง หน่วยเป็น px
 *
 * ถ้าวางด้วย 150px ไม่ได้ ระบบจะค่อย ๆ ลดลง
 * แต่จะไม่ต่ำกว่าค่านี้
 */
export const TILE_MIN_DISTANCE_FALLBACK_PX = 110

/**
 * จำนวนครั้งสูงสุดที่ระบบจะลองสุ่มตำแหน่งหรือทิศทางใหม่
 */
export const TILE_PLACEMENT_MAX_ATTEMPTS = 160

export type NumberSearchPathDistanceConfig = {
  enabled: boolean
  maxLayoutAttempts: number
  maxDirectionAttempts: number
  fallbackDistanceStepPx: number

  /**
   * มุมเลี้ยวขั้นต่ำระหว่างเลขที่ต้องกดต่อกัน
   *
   * ใช้กันไม่ให้เลขเรียงเป็นเส้นตรงไปทางเดียวกันมากเกินไป
   */
  minTurnAngleDeg: number

  /**
   * มุมเลี้ยวสูงสุด
   *
   * ใช้กันไม่ให้ย้อนกลับเกือบ 180 องศาบ่อยเกินไป
   */
  maxTurnAngleDeg: number

  /**
   * ระยะของแต่ละ Level
   *
   * จำนวนค่าใน array ต้องเท่ากับจำนวนตัวเลขของ Level นั้น
   *
   * ตัวอย่าง Level 1:
   * [240, 180, 240, 200, 260]
   *
   * หมายความว่า:
   * center → number1 = 240px
   * number1 → number2 = 180px
   * number2 → number3 = 240px
   * number3 → number4 = 200px
   * number4 → number5 = 260px
   */
  levelPathDistancesPx: Record<number, number[]>
}

/**
 * Config สำหรับ controlled path placement
 *
 * เป้าหมาย:
 * - ผู้เล่นทุกคนเจอชุดระยะเดียวกันในแต่ละ Level
 * - ทิศทางยังสุ่ม เพื่อให้ตำแหน่งไม่เหมือนกัน
 * - คุมมุมเลี้ยว เพื่อไม่ให้ตัวเลขเรียงเป็นเส้นตรง
 */
export const NUMBER_SEARCH_PATH_DISTANCE_CONFIG: NumberSearchPathDistanceConfig =
  {
    enabled: true,

    maxLayoutAttempts: 160,
    maxDirectionAttempts: 96,
    fallbackDistanceStepPx: 4,

    minTurnAngleDeg: 50,
    maxTurnAngleDeg: 170,

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