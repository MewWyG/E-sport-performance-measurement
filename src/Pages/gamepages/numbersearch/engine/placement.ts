import {
  NUMBER_SEARCH_PATH_DISTANCE_CONFIG,
  TILE_MIN_DISTANCE_FALLBACK_PX,
  TILE_MIN_DISTANCE_PX,
  TILE_PLACEMENT_MARGIN_X_PX,
  TILE_PLACEMENT_MARGIN_Y_PX,
  TILE_PLACEMENT_MAX_ATTEMPTS,
  TILE_SIZE,
} from '../config'
import type { NumberTileData } from '../types'

export type NumberSearchBoardBounds = {
  width: number
  height: number
}

/**
 * Number Search Placement System
 *
 * หน้าที่ของไฟล์นี้:
 * - วางตำแหน่งตัวเลขบนสนามเล่น
 * - คุมระยะจากจุดกลางสนามไปเลขแรก
 * - คุมระยะระหว่างเลขที่ต้องกดต่อกัน
 * - สุ่มทิศทาง เพื่อให้แต่ละรอบไม่เหมือนกัน
 * - คุมมุมเลี้ยว เพื่อไม่ให้ตัวเลขเรียงเป็นเส้นตรง
 * - คุมระยะห่างขั้นต่ำ เพื่อไม่ให้ตัวเลขชิดกันเกินไป
 *
 * สำคัญ:
 * ถ้า controlled path เปิดอยู่ ระบบจะพยายามรักษาระยะตาม config
 * และจะไม่ fallback ไปเป็น scattered random เพราะจะทำให้ระยะไม่เท่ากัน
 */
export function createNumberTiles(
  numbers: number[],
  level: number,
  bounds: NumberSearchBoardBounds,
) {
  const positionsByValue = NUMBER_SEARCH_PATH_DISTANCE_CONFIG.enabled
    ? createControlledPathPositions(numbers, level, bounds)
    : createScatteredPositionMap(numbers, bounds)

  return numbers.map<NumberTileData>((value) => {
    const position = positionsByValue.get(value) ?? createRandomPosition(bounds)

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

type PathStepResult = {
  position: PlacementPosition
  angle: number
}

type TurnConstraintMode = 'strict' | 'relaxed' | 'disabled'

/**
 * สร้างตำแหน่งแบบ controlled path
 *
 * ตัวอย่าง:
 * numbers = [2, 4, 7, 9]
 * distances = [240, 180, 240, 200]
 *
 * ความหมาย:
 * center → 2 = 240px
 * 2 → 4 = 180px
 * 4 → 7 = 240px
 * 7 → 9 = 200px
 *
 * ทิศทางสุ่ม แต่ระยะยังคงตาม config
 */
function createControlledPathPositions(
  numbers: number[],
  level: number,
  bounds: NumberSearchBoardBounds,
): Map<number, PlacementPosition> {
  if (numbers.length <= 0) {
    return new Map()
  }

  let minTileDistance = TILE_MIN_DISTANCE_PX

  while (minTileDistance >= TILE_MIN_DISTANCE_FALLBACK_PX) {
    for (
      let layoutAttempt = 0;
      layoutAttempt < NUMBER_SEARCH_PATH_DISTANCE_CONFIG.maxLayoutAttempts;
      layoutAttempt += 1
    ) {
      const result = tryCreateControlledPathLayout({
        numbers,
        level,
        bounds,
        minTileDistance,
        turnConstraintMode: 'strict',
      })

      if (result !== null) {
        return result
      }
    }

    minTileDistance -=
      NUMBER_SEARCH_PATH_DISTANCE_CONFIG.fallbackDistanceStepPx
  }

  /**
   * ถ้า strict วางไม่ได้ ให้ผ่อนเงื่อนไขมุมเลี้ยวลง
   * แต่ยังคงใช้ระยะจาก config เหมือนเดิม
   */
  const relaxedResult = tryCreateRelaxedControlledPathPositions({
    numbers,
    level,
    bounds,
  })

  if (relaxedResult !== null) {
    return relaxedResult
  }

  /**
   * fallback สุดท้าย:
   * ยังใช้ controlled path อยู่ แต่ปิดกฎมุมและลด min distance
   * เพื่อรักษาระยะตาม config ให้ได้มากที่สุด
   *
   * จุดนี้จะไม่ใช้ scattered random เพราะจะทำให้ระยะไม่แฟร์
   */
  const distanceOnlyResult = tryCreateControlledPathLayout({
    numbers,
    level,
    bounds,
    minTileDistance: 0,
    turnConstraintMode: 'disabled',
  })

  if (distanceOnlyResult !== null) {
    return distanceOnlyResult
  }

  /**
   * กรณีแย่ที่สุดจริง ๆ เช่น config ระยะใหญ่เกินขนาดสนาม
   * ถึงจะ fallback เป็น scattered
   *
   * ถ้าเกิดเคสนี้บ่อย แปลว่าต้องลดระยะใน config
   */
  return createScatteredPositionMap(numbers, bounds)
}

type TryCreateRelaxedControlledPathPositionsParams = {
  numbers: number[]
  level: number
  bounds: NumberSearchBoardBounds
}

function tryCreateRelaxedControlledPathPositions({
  numbers,
  level,
  bounds,
}: TryCreateRelaxedControlledPathPositionsParams) {
  const relaxedMinDistances = [100, 80, 60]

  for (const minTileDistance of relaxedMinDistances) {
    for (
      let layoutAttempt = 0;
      layoutAttempt < NUMBER_SEARCH_PATH_DISTANCE_CONFIG.maxLayoutAttempts;
      layoutAttempt += 1
    ) {
      const result = tryCreateControlledPathLayout({
        numbers,
        level,
        bounds,
        minTileDistance,
        turnConstraintMode: 'relaxed',
      })

      if (result !== null) {
        return result
      }
    }
  }

  return null
}

type TryCreateControlledPathLayoutParams = {
  numbers: number[]
  level: number
  bounds: NumberSearchBoardBounds
  minTileDistance: number
  turnConstraintMode: TurnConstraintMode
}

function tryCreateControlledPathLayout({
  numbers,
  level,
  bounds,
  minTileDistance,
  turnConstraintMode,
}: TryCreateControlledPathLayoutParams): Map<number, PlacementPosition> | null {
  const positions: PlacementPosition[] = []
  const positionsByValue = new Map<number, PlacementPosition>()

  const distances = getLevelPathDistances({
    level,
    count: numbers.length,
  })

  const centerPoint = createCenterPosition(bounds)

  let previousAngle: number | null = null

  for (let index = 0; index < numbers.length; index += 1) {
    const distance = distances[index]
    const previousPosition = index === 0 ? centerPoint : positions[index - 1]

    const nextStep = createNextPathStep({
      previousPosition,
      previousAngle,
      existingPositions: positions,
      bounds,
      pathDistance: distance,
      minTileDistance,
      turnConstraintMode,
    })

    if (nextStep === null) {
      return null
    }

    positions.push(nextStep.position)
    positionsByValue.set(numbers[index], nextStep.position)

    previousAngle = nextStep.angle
  }

  return positionsByValue
}

type CreateNextPathStepParams = {
  previousPosition: PlacementPosition
  previousAngle: number | null
  existingPositions: PlacementPosition[]
  bounds: NumberSearchBoardBounds
  pathDistance: number
  minTileDistance: number
  turnConstraintMode: TurnConstraintMode
}

/**
 * วางเลขตัวถัดไปจากตำแหน่งก่อนหน้า
 *
 * สูตร:
 * nextPosition = previousPosition + direction × pathDistance
 *
 * pathDistance มาจาก config ดังนั้นระยะจะเท่ากันตามที่กำหนด
 * direction เป็นมุมสุ่ม
 */
function createNextPathStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  const randomResult = tryCreateRandomAngleStep({
    previousPosition,
    previousAngle,
    existingPositions,
    bounds,
    pathDistance,
    minTileDistance,
    turnConstraintMode,
  })

  if (randomResult !== null) {
    return randomResult
  }

  /**
   * ถ้าสุ่มมุมไม่สำเร็จ ให้ลองกวาดมุมรอบวงแบบเป็นระบบ
   * วิธีนี้ช่วยลดโอกาส fallback และยังรักษาระยะ pathDistance ไว้
   */
  return tryCreateSweptAngleStep({
    previousPosition,
    previousAngle,
    existingPositions,
    bounds,
    pathDistance,
    minTileDistance,
    turnConstraintMode,
  })
}

function tryCreateRandomAngleStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  for (
    let attempt = 0;
    attempt < NUMBER_SEARCH_PATH_DISTANCE_CONFIG.maxDirectionAttempts;
    attempt += 1
  ) {
    const angle = Math.random() * Math.PI * 2

    const result = createStepCandidate({
      previousPosition,
      previousAngle,
      existingPositions,
      bounds,
      pathDistance,
      minTileDistance,
      turnConstraintMode,
      angle,
    })

    if (result !== null) {
      return result
    }
  }

  return null
}

function tryCreateSweptAngleStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  const sweepCount = 96
  const offset = Math.random() * Math.PI * 2

  for (let index = 0; index < sweepCount; index += 1) {
    const angle = offset + (index / sweepCount) * Math.PI * 2

    const result = createStepCandidate({
      previousPosition,
      previousAngle,
      existingPositions,
      bounds,
      pathDistance,
      minTileDistance,
      turnConstraintMode,
      angle,
    })

    if (result !== null) {
      return result
    }
  }

  return null
}

type CreateStepCandidateParams = {
  previousPosition: PlacementPosition
  previousAngle: number | null
  existingPositions: PlacementPosition[]
  bounds: NumberSearchBoardBounds
  pathDistance: number
  minTileDistance: number
  turnConstraintMode: TurnConstraintMode
  angle: number
}

function createStepCandidate({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
  angle,
}: CreateStepCandidateParams): PathStepResult | null {
  if (
    !isValidTurnAngle({
      previousAngle,
      nextAngle: angle,
      mode: turnConstraintMode,
    })
  ) {
    return null
  }

  const xPx = previousPosition.xPx + Math.cos(angle) * pathDistance
  const yPx = previousPosition.yPx + Math.sin(angle) * pathDistance

  const candidate = createPositionFromPx({
    xPx,
    yPx,
    bounds,
  })

  if (!isInsideSafeBounds(candidate, bounds)) {
    return null
  }

  if (
    minTileDistance > 0 &&
    !isFarEnoughFromAll(candidate, existingPositions, minTileDistance)
  ) {
    return null
  }

  return {
    position: candidate,
    angle,
  }
}

function isValidTurnAngle({
  previousAngle,
  nextAngle,
  mode,
}: {
  previousAngle: number | null
  nextAngle: number
  mode: TurnConstraintMode
}) {
  if (previousAngle === null || mode === 'disabled') {
    return true
  }

  const angleDiff = getAngleDifferenceDeg(previousAngle, nextAngle)

  if (mode === 'relaxed') {
    return angleDiff >= 30 && angleDiff <= 175
  }

  return (
    angleDiff >= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.minTurnAngleDeg &&
    angleDiff <= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.maxTurnAngleDeg
  )
}

function getAngleDifferenceDeg(angleA: number, angleB: number) {
  const fullCircle = Math.PI * 2
  const diff = Math.abs(angleA - angleB) % fullCircle
  const shortestDiff = Math.min(diff, fullCircle - diff)

  return (shortestDiff * 180) / Math.PI
}

function getLevelPathDistances({
  level,
  count,
}: {
  level: number
  count: number
}) {
  const configuredDistances =
    NUMBER_SEARCH_PATH_DISTANCE_CONFIG.levelPathDistancesPx[level] ?? []

  if (configuredDistances.length >= count) {
    return configuredDistances.slice(0, count)
  }

  const distances = [...configuredDistances]

  const fallbackBase =
    distances.length > 0 ? distances[distances.length - 1] : 240

  while (distances.length < count) {
    const nextDistance =
      fallbackBase +
      (distances.length - configuredDistances.length + 1) * 20

    distances.push(nextDistance)
  }

  return distances
}

/**
 * ใช้เฉพาะตอนปิด controlled path หรือกรณีสุดท้ายจริง ๆ
 */
function createScatteredPositionMap(
  numbers: number[],
  bounds: NumberSearchBoardBounds,
): Map<number, PlacementPosition> {
  const positions = createScatteredPositions(numbers.length, bounds)
  const positionsByValue = new Map<number, PlacementPosition>()

  numbers.forEach((value, index) => {
    positionsByValue.set(value, positions[index])
  })

  return positionsByValue
}

function createScatteredPositions(
  count: number,
  bounds: NumberSearchBoardBounds,
): PlacementPosition[] {
  const positions: PlacementPosition[] = []

  for (let index = 0; index < count; index += 1) {
    const position = createValidScatteredPosition(positions, bounds)

    positions.push(position)
  }

  return positions
}

function createValidScatteredPosition(
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

    minDistance -=
      NUMBER_SEARCH_PATH_DISTANCE_CONFIG.fallbackDistanceStepPx
  }

  return createRandomPosition(bounds)
}

function createRandomPosition(
  bounds: NumberSearchBoardBounds,
): PlacementPosition {
  const safeBounds = createSafePlacementBounds(bounds)

  const xPx = randomBetween(safeBounds.minX, safeBounds.maxX)
  const yPx = randomBetween(safeBounds.minY, safeBounds.maxY)

  return createPositionFromPx({
    xPx,
    yPx,
    bounds,
  })
}

function createCenterPosition(
  bounds: NumberSearchBoardBounds,
): PlacementPosition {
  return createPositionFromPx({
    xPx: bounds.width / 2,
    yPx: bounds.height / 2,
    bounds,
  })
}

function createPositionFromPx({
  xPx,
  yPx,
  bounds,
}: {
  xPx: number
  yPx: number
  bounds: NumberSearchBoardBounds
}): PlacementPosition {
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

function isInsideSafeBounds(
  position: PlacementPosition,
  bounds: NumberSearchBoardBounds,
) {
  const safeBounds = createSafePlacementBounds(bounds)

  return (
    position.xPx >= safeBounds.minX &&
    position.xPx <= safeBounds.maxX &&
    position.yPx >= safeBounds.minY &&
    position.yPx <= safeBounds.maxY
  )
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