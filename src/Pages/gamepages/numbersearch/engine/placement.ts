import {
  NUMBER_SEARCH_DEBUG_CONFIG,
  NUMBER_SEARCH_PATH_DISTANCE_CONFIG,
  NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG,
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

// สร้างตำแหน่งและข้อมูลของตัวเลขบนกระดาน
// โดยพิจารณาจากการตั้งค่าของแต่ละเลเวล และชนิดการจัดตำแหน่ง
export function createNumberTiles(
  numbers: number[],
  level: number,
  bounds: NumberSearchBoardBounds,
) {
  const positionsByValue = NUMBER_SEARCH_PATH_DISTANCE_CONFIG.enabled
    ? createControlledPathPositions(numbers, level, bounds)
    : createScatteredPositionMap(numbers, bounds)

  return numbers.map<NumberTileData>((value) => {
    const position = positionsByValue.get(value)

    if (!position) {
      throw new Error(`Missing Number Search position for value ${value}`)
    }

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

type DirectionCandidate = {
  position: PlacementPosition
  angle: number
}

type TurnConstraintMode = 'strict' | 'relaxed' | 'disabled'

// สร้างตำแหน่งตัวเลขแบบ path-controlled เพื่อให้ตัวเลขเรียงตามระยะทาง
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

  const relaxedResult = tryCreateRelaxedControlledPathPositions({
    numbers,
    level,
    bounds,
  })

  if (relaxedResult !== null) {
    return relaxedResult
  }

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

  if (NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG.allowScatteredFallback) {
    return createScatteredPositionMap(numbers, bounds)
  }

  throw new Error(
    `Unable to create controlled Number Search layout for level ${level}`,
  )
}

type TryCreateRelaxedControlledPathPositionsParams = {
  numbers: number[]
  level: number
  bounds: NumberSearchBoardBounds
}

// ลองสร้างตำแหน่ง path-controlled โดยผ่อนคลายข้อจำกัดมุมเลี้ยว
function tryCreateRelaxedControlledPathPositions({
  numbers,
  level,
  bounds,
}: TryCreateRelaxedControlledPathPositionsParams) {
  for (const minTileDistance of NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG.relaxedMinDistancesPx) {
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

// สร้าง layout path-controlled โดยวางแต่ละตำแหน่งตามระยะที่กำหนด
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

  if (NUMBER_SEARCH_DEBUG_CONFIG.enablePlacementDistanceLog) {
    debugPathDistances({
      numbers,
      positions,
      distances,
      bounds,
      level,
      mode: turnConstraintMode,
      minTileDistance,
    })
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

// สร้างตำแหน่งถัดไปบน path โดยพยายามใช้ทิศทางที่เหมาะสม
function createNextPathStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  const sectorResult = tryCreateSectorDirectionStep({
    previousPosition,
    previousAngle,
    existingPositions,
    bounds,
    pathDistance,
    minTileDistance,
    turnConstraintMode,
  })

  if (sectorResult !== null) {
    return sectorResult
  }

  return tryCreateSweptDirectionStep({
    previousPosition,
    previousAngle,
    existingPositions,
    bounds,
    pathDistance,
    minTileDistance,
    turnConstraintMode,
  })
}

// ลองเลือกทิศทางโดยแบ่ง sector รอบตำแหน่งก่อนหน้า
function tryCreateSectorDirectionStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  const candidates = createAvailableDirectionCandidates({
    previousPosition,
    bounds,
    pathDistance,
    directionCount: NUMBER_SEARCH_PATH_DISTANCE_CONFIG.directionSectorCount,
  })

  return chooseValidCandidate({
    candidates,
    previousAngle,
    existingPositions,
    minTileDistance,
    turnConstraintMode,
  })
}

// ลองเลือกทิศทางโดยสวิงมุมรอบตำแหน่งก่อนหน้า
function tryCreateSweptDirectionStep({
  previousPosition,
  previousAngle,
  existingPositions,
  bounds,
  pathDistance,
  minTileDistance,
  turnConstraintMode,
}: CreateNextPathStepParams): PathStepResult | null {
  const candidates = createAvailableDirectionCandidates({
    previousPosition,
    bounds,
    pathDistance,
    directionCount: NUMBER_SEARCH_PATH_DISTANCE_CONFIG.angleSweepCount,
  })

  return chooseValidCandidate({
    candidates,
    previousAngle,
    existingPositions,
    minTileDistance,
    turnConstraintMode,
  })
}

type CreateAvailableDirectionCandidatesParams = {
  previousPosition: PlacementPosition
  bounds: NumberSearchBoardBounds
  pathDistance: number
  directionCount: number
}

// สร้างชุดทิศทางที่เป็นไปได้สำหรับการวางตำแหน่งถัดไป
function createAvailableDirectionCandidates({
  previousPosition,
  bounds,
  pathDistance,
  directionCount,
}: CreateAvailableDirectionCandidatesParams): DirectionCandidate[] {
  const safeBounds = createSafePlacementBounds(bounds)
  const angleOffset = Math.random() * ((Math.PI * 2) / directionCount)

  const candidates = Array.from({ length: directionCount }, (_, index) => {
    const angle = angleOffset + (index / directionCount) * Math.PI * 2

    const xPx = previousPosition.xPx + Math.cos(angle) * pathDistance
    const yPx = previousPosition.yPx + Math.sin(angle) * pathDistance

    const position = createPositionFromPx({
      xPx,
      yPx,
      bounds,
    })

    return {
      position,
      angle,
    }
  })

  return shuffleArray(
    candidates.filter(({ position }) =>
      isInsideSafeBoundsWithSafeBounds(position, safeBounds),
    ),
  )
}

type ChooseValidCandidateParams = {
  candidates: DirectionCandidate[]
  previousAngle: number | null
  existingPositions: PlacementPosition[]
  minTileDistance: number
  turnConstraintMode: TurnConstraintMode
}

// เลือก candidate ที่ผ่านข้อจำกัดมุมและระยะห่างจาก tile ก่อนหน้า
function chooseValidCandidate({
  candidates,
  previousAngle,
  existingPositions,
  minTileDistance,
  turnConstraintMode,
}: ChooseValidCandidateParams): PathStepResult | null {
  for (const candidate of candidates) {
    if (
      !isValidTurnAngle({
        previousAngle,
        nextAngle: candidate.angle,
        mode: turnConstraintMode,
      })
    ) {
      continue
    }

    if (
      minTileDistance > 0 &&
      !isFarEnoughFromAll(candidate.position, existingPositions, minTileDistance)
    ) {
      continue
    }

    return {
      position: candidate.position,
      angle: candidate.angle,
    }
  }

  return null
}

// ตรวจสอบมุมเลี้ยวถัดไปว่าเป็นไปตามข้อจำกัดของโหมดหรือไม่
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
    return (
      angleDiff >= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.relaxedMinTurnAngleDeg &&
      angleDiff <= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.relaxedMaxTurnAngleDeg
    )
  }

  return (
    angleDiff >= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.minTurnAngleDeg &&
    angleDiff <= NUMBER_SEARCH_PATH_DISTANCE_CONFIG.maxTurnAngleDeg
  )
}

// คำนวณความต่างมุมระหว่างสองทิศทางในหน่วยองศา
function getAngleDifferenceDeg(angleA: number, angleB: number) {
  const fullCircle = Math.PI * 2
  const diff = Math.abs(angleA - angleB) % fullCircle
  const shortestDiff = Math.min(diff, fullCircle - diff)

  return (shortestDiff * 180) / Math.PI
}

// คืนค่าระยะทางสำหรับแต่ละค่าที่จะวางในเลเวลนั้น
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
    distances.length > 0
      ? distances[distances.length - 1]
      : NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG.defaultPathDistancePx

  while (distances.length < count) {
    const nextDistance =
      fallbackBase +
      (distances.length - configuredDistances.length + 1) *
        NUMBER_SEARCH_PLACEMENT_FALLBACK_CONFIG.generatedPathDistanceStepPx

    distances.push(nextDistance)
  }

  return distances
}

// สร้างตำแหน่งแบบกระจายสำหรับการวางตัวเลขโดยไม่ใช้ path
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

// สร้างชุดตำแหน่งแบบกระจายสำหรับจำนวน tile ที่กำหนด
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

// หาตำแหน่งแบบสุ่มที่ยังไม่ชิดกับตำแหน่งอื่นเกินไป
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

// สร้างตำแหน่งแบบสุ่มภายในขอบเขตปลอดภัย
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

// สร้างตำแหน่งกลางกระดาน
function createCenterPosition(
  bounds: NumberSearchBoardBounds,
): PlacementPosition {
  return createPositionFromPx({
    xPx: bounds.width / 2,
    yPx: bounds.height / 2,
    bounds,
  })
}

// แปลงตำแหน่งพิกเซลเป็นค่าเปอร์เซ็นต์สำหรับการแสดงผล
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

type SafePlacementBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// สร้างขอบเขตปลอดภัยสำหรับวาง tile โดยไม่ให้ชนขอบหน้าจอ
function createSafePlacementBounds(
  bounds: NumberSearchBoardBounds,
): SafePlacementBounds {
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

// ตรวจสอบว่าตำแหน่งอยู่ภายในขอบเขตปลอดภัยหรือไม่
function isInsideSafeBoundsWithSafeBounds(
  position: PlacementPosition,
  safeBounds: SafePlacementBounds,
) {
  return (
    position.xPx >= safeBounds.minX &&
    position.xPx <= safeBounds.maxX &&
    position.yPx >= safeBounds.minY &&
    position.yPx <= safeBounds.maxY
  )
}

// ตรวจสอบว่าตำแหน่ง candidate ห่างจาก tile อื่นพอหรือไม่
function isFarEnoughFromAll(
  candidate: PlacementPosition,
  existingPositions: PlacementPosition[],
  minDistancePx: number,
) {
  return existingPositions.every((position) => {
    return getDistancePx(candidate, position) >= minDistancePx
  })
}

// คำนวณระยะทางระหว่างตำแหน่งสองตำแหน่งในหน่วยพิกเซล
function getDistancePx(a: PlacementPosition, b: PlacementPosition) {
  const dx = a.xPx - b.xPx
  const dy = a.yPx - b.yPx

  return Math.hypot(dx, dy)
}

// สุ่มค่าทศนิยมระหว่าง min และ max
function randomBetween(min: number, max: number) {
  if (max <= min) {
    return min
  }

  return Math.random() * (max - min) + min
}

// สุ่มเรียงลำดับ array โดยใช้ Fisher-Yates algorithm
function shuffleArray<T>(items: T[]) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))

    ;[result[index], result[swapIndex]] = [
      result[swapIndex],
      result[index],
    ]
  }

  return result
}

// แสดงข้อมูล debug ของการจัดวาง path เพื่อช่วยวิเคราะห์การวางตำแหน่ง
function debugPathDistances({
  numbers,
  positions,
  distances,
  bounds,
  level,
  mode,
  minTileDistance,
}: {
  numbers: number[]
  positions: PlacementPosition[]
  distances: number[]
  bounds: NumberSearchBoardBounds
  level: number
  mode: TurnConstraintMode
  minTileDistance: number
}) {
  const center = {
    xPx: bounds.width / 2,
    yPx: bounds.height / 2,
  }

  console.group(
    `Number Search Level ${level} placement | mode=${mode} | minDistance=${minTileDistance}`,
  )

  console.table(
    positions.map((position, index) => {
      const previous = index === 0 ? center : positions[index - 1]

      const actualDistance = Math.hypot(
        position.xPx - previous.xPx,
        position.yPx - previous.yPx,
      )

      return {
        order: index + 1,
        value: numbers[index],
        plannedDistance: distances[index],
        actualDistance: Math.round(actualDistance),
        xPx: Math.round(position.xPx),
        yPx: Math.round(position.yPx),
      }
    }),
  )

  console.groupEnd()
}