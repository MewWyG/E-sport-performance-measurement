import {
  TILE_MIN_DISTANCE_FALLBACK_PERCENT,
  TILE_MIN_DISTANCE_PERCENT,
  TILE_PLACEMENT_MARGIN_X_PERCENT,
  TILE_PLACEMENT_MARGIN_Y_PERCENT,
  TILE_PLACEMENT_MAX_ATTEMPTS,
} from '../config'
import type { NumberTileData } from '../types'
import { shuffleArray } from './numberFactory'

export function createNumberTiles(numbers: number[], level: number) {
  const displayNumbers = shuffleArray(numbers)
  const positions = createScatteredPositions(displayNumbers.length)

  return displayNumbers.map<NumberTileData>((value, index) => {
    const position = positions[index]

    return {
      id: `level-${level}-number-${value}`,
      value,
      xPercent: position.xPercent,
      yPercent: position.yPercent,
      isCleared: false,
    }
  })
}

type PlacementPosition = {
  xPercent: number
  yPercent: number
}

/**
 * สร้างตำแหน่งตัวเลขแบบกระจายอิสระ
 * ไม่เรียงเป็น grid แนวนอน/แนวตั้ง
 *
 * หลักการ:
 * 1. สุ่ม x/y ในพื้นที่สนาม
 * 2. เช็กว่าห่างจากตัวเลขก่อนหน้าพอไหม
 * 3. ถ้าใกล้เกินไปสุ่มใหม่
 * 4. ถ้าสุ่มไม่ได้จริง ๆ จะค่อย ๆ ลดระยะขั้นต่ำลง
 */
function createScatteredPositions(count: number): PlacementPosition[] {
  const positions: PlacementPosition[] = []

  for (let index = 0; index < count; index += 1) {
    const position = createValidPosition(positions)

    positions.push(position)
  }

  return positions
}

function createValidPosition(
  existingPositions: PlacementPosition[],
): PlacementPosition {
  let minDistance = TILE_MIN_DISTANCE_PERCENT

  while (minDistance >= TILE_MIN_DISTANCE_FALLBACK_PERCENT) {
    for (
      let attempt = 0;
      attempt < TILE_PLACEMENT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const candidate = createRandomPosition()

      if (isFarEnoughFromAll(candidate, existingPositions, minDistance)) {
        return candidate
      }
    }

    /**
     * ถ้าวางไม่ได้ แปลว่าพื้นที่เริ่มแน่น
     * จึงลดระยะขั้นต่ำลงทีละนิดเพื่อไม่ให้เกมค้าง
     */
    minDistance -= 1
  }

  /**
   * fallback สุดท้าย:
   * ถ้าสุ่มยังไม่ได้จริง ๆ ให้ใช้ตำแหน่ง random ไปเลย
   * เพื่อให้ level สูง ๆ ยังเล่นต่อได้
   */
  return createRandomPosition()
}

function createRandomPosition(): PlacementPosition {
  return {
    xPercent: randomBetween(
      TILE_PLACEMENT_MARGIN_X_PERCENT,
      100 - TILE_PLACEMENT_MARGIN_X_PERCENT,
    ),
    yPercent: randomBetween(
      TILE_PLACEMENT_MARGIN_Y_PERCENT,
      100 - TILE_PLACEMENT_MARGIN_Y_PERCENT,
    ),
  }
}

function isFarEnoughFromAll(
  candidate: PlacementPosition,
  existingPositions: PlacementPosition[],
  minDistance: number,
) {
  return existingPositions.every((position) => {
    return getDistance(candidate, position) >= minDistance
  })
}

function getDistance(a: PlacementPosition, b: PlacementPosition) {
  const dx = a.xPercent - b.xPercent
  const dy = a.yPercent - b.yPercent

  return Math.hypot(dx, dy)
}

function randomBetween(min: number, max: number) {
  if (max <= min) {
    return min
  }

  return Math.random() * (max - min) + min
}