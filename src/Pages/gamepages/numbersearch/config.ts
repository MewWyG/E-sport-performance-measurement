export const WRONG_CLICK_LIMIT = 3

export const BASE_NUMBER_POOL = 5
export const NUMBER_POOL_STEP = 5
export const BASE_PLAY_COUNT = 4

export const TILE_SIZE = 56
export const BOARD_MIN_HEIGHT = 520

/**
 * margin ของพื้นที่วางตัวเลข หน่วยเป็น percent
 * กันไม่ให้เลขชิดขอบสนามเกินไป
 */
export const TILE_PLACEMENT_MARGIN_X_PERCENT = 9
export const TILE_PLACEMENT_MARGIN_Y_PERCENT = 12

/**
 * ระยะห่างขั้นต่ำระหว่างตัวเลข หน่วยเป็น percent
 * ค่านี้ใช้กันไม่ให้ตัวเลขอยู่ติดกันหรือทับกัน
 */
export const TILE_MIN_DISTANCE_PERCENT = 14

/**
 * จำนวนครั้งที่ระบบจะพยายามสุ่มตำแหน่งใหม่
 * ถ้าเจอตำแหน่งที่ใกล้ตัวอื่นเกินไป
 */
export const TILE_PLACEMENT_MAX_ATTEMPTS = 120

/**
 * ถ้า level สูงมากและตัวเลขเยอะจนวางด้วยระยะเดิมไม่ได้
 * จะค่อย ๆ ลดระยะห่างขั้นต่ำลง แต่ไม่ต่ำกว่าค่านี้
 */
export const TILE_MIN_DISTANCE_FALLBACK_PERCENT = 8