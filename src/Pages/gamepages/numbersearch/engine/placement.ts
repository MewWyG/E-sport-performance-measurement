import {
  TILE_MIN_DISTANCE_FALLBACK_PX,
  TILE_MIN_DISTANCE_PX,
  TILE_PLACEMENT_MARGIN_X_PX,
  TILE_PLACEMENT_MARGIN_Y_PX,
  TILE_PLACEMENT_MAX_ATTEMPTS,
  TILE_SIZE,
} from '../config'
import type { NumberTileData } from '../types'
import { shuffleArray } from './numberFactory'

export type NumberSearchBoardBounds = {
  width: number
  height: number
}

export function createNumberTiles(
  numbers: number[],
  level: number,
  bounds: NumberSearchBoardBounds,
) {
  const displayNumbers = shuffleArray(numbers)
  const positions = createScatteredPositions(displayNumbers.length, bounds)

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
  xPx: number
  yPx: number
  xPercent: number
  yPercent: number
}

/**
 * สร้างตำแหน่งตัวเลขแบบกระจายอิสระ
 * ไม่เรียงเป็น grid แนวนอน/แนวตั้ง
 *
 * หลักการ:
 * 1. วัดขนาดสนามจริงเป็น px
 * 2. สุ่ม x/y เป็น px
 * 3. เช็กระยะห่างขั้นต่ำเป็น px
 * 4. ถ้าใกล้ตัวอื่นเกินไปสุ่มใหม่
 * 5. หลังได้ตำแหน่งแล้วแปลงเป็น percent เพื่อให้ UI เดิมใช้ left/top ได้
 */
function createScatteredPositions(
  count: number,
  bounds: NumberSearchBoardBounds,
): PlacementPosition[] {
  const positions: PlacementPosition[] = []

  for (let index = 0; index < count; index += 1) {
    const position = createValidPosition(positions, bounds)

    positions.push(position)
  }

  return positions
}

function createValidPosition(
  existingPositions: PlacementPosition[],
  bounds: NumberSearchBoardBounds,
): PlacementPosition {
  let minDistance = TILE_MIN_DISTANCE_PX

  while (minDistance >= TILE_MIN_DISTANCE_FALLBACK_PX) {
    for (
      let attempt = 0;
      attempt < TILE_PLACEMENT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const candidate = createRandomPosition(bounds)

      if (isFarEnoughFromAll(candidate, existingPositions, minDistance)) {
        return candidate
      }
    }

    /**
     * ถ้าวางไม่ได้ แปลว่าพื้นที่เริ่มแน่น
     * จึงลดระยะขั้นต่ำลงทีละนิดเพื่อไม่ให้เกมค้าง
     */
    minDistance -= 4
  }

  /**
   * fallback สุดท้าย:
   * ถ้าสุ่มยังไม่ได้จริง ๆ ให้ใช้ตำแหน่ง random ไปเลย
   * เพื่อให้ level สูง ๆ ยังเล่นต่อได้
   */
  return createRandomPosition(bounds)
}

function createRandomPosition(
  bounds: NumberSearchBoardBounds,
): PlacementPosition {
  const safeBounds = createSafePlacementBounds(bounds)

  const xPx = randomBetween(safeBounds.minX, safeBounds.maxX)
  const yPx = randomBetween(safeBounds.minY, safeBounds.maxY)

  return {
    xPx,
    yPx,
    xPercent: (xPx / bounds.width) * 100,
    yPercent: (yPx / bounds.height) * 100,
  }
}

function createSafePlacementBounds(bounds: NumberSearchBoardBounds) {
  const halfTileSize = TILE_SIZE / 2

  const minX = Math.max(TILE_PLACEMENT_MARGIN_X_PX, halfTileSize)
  const maxX = Math.max(bounds.width - minX, minX)

  const minY = Math.max(TILE_PLACEMENT_MARGIN_Y_PX, halfTileSize)
  const maxY = Math.max(bounds.height - minY, minY)

  return {
    minX,
    maxX,
    minY,
    maxY,
  }
}

function isFarEnoughFromAll(
  candidate: PlacementPosition,
  existingPositions: PlacementPosition[],
  minDistancePx: number,
) {
  return existingPositions.every((position) => {
    return getDistancePx(candidate, position) >= minDistancePx
  })
}

function getDistancePx(a: PlacementPosition, b: PlacementPosition) {
  const dx = a.xPx - b.xPx
  const dy = a.yPx - b.yPx

  return Math.hypot(dx, dy)
}

function randomBetween(min: number, max: number) {
  if (max <= min) {
    return min
  }

  return Math.random() * (max - min) + min
}