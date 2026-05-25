import {
  DISTANCE_VALUE_STEP,
  GAME_MODE_CONFIG,
  MOVEMENT_STEP_DISTANCE_STAGE_START,
  SPAWN_DISTANCE_STAGE_START,
  TARGETS_PER_STAGE,
  TOTAL_STAGES,
  TOTAL_TARGETS,
} from '../config'
import type { GameMode, TargetDistancePlan } from '../types'

export type DistanceSchedule = {
  mode: GameMode
  plans: TargetDistancePlan[]
}

// สร้างตารางระยะสำหรับเป้าแต่ละตัวในเกม
// ตารางนี้กำหนดทั้ง movementStepDistance และ spawnDistance
export function createDistanceSchedule(mode: GameMode): DistanceSchedule {
  const modeConfig = GAME_MODE_CONFIG[mode]
  const plans: TargetDistancePlan[] = []

  for (let stageIndex = 0; stageIndex < TOTAL_STAGES; stageIndex += 1) {
    const movementStepValues = createStageDistanceValues({
      stageIndex,
      startValue: MOVEMENT_STEP_DISTANCE_STAGE_START,
      multiplier: modeConfig.distanceMultiplier,
    })

    const spawnDistanceValues = createStageDistanceValues({
      stageIndex,
      startValue: SPAWN_DISTANCE_STAGE_START,
      multiplier: modeConfig.distanceMultiplier,
    })

    const movementStepQueue =
      createInterleavedMiniBatchShuffleBag(movementStepValues)

    const spawnDistanceQueue =
      createInterleavedMiniBatchShuffleBag(spawnDistanceValues)

    for (
      let stageTargetIndex = 0;
      stageTargetIndex < TARGETS_PER_STAGE;
      stageTargetIndex += 1
    ) {
      const targetIndex = stageIndex * TARGETS_PER_STAGE + stageTargetIndex

      plans.push({
        targetIndex,
        targetNumber: targetIndex + 1,
        stageIndex,
        stageTargetIndex,
        movementStepDistance: movementStepQueue[stageTargetIndex],
        spawnDistance: spawnDistanceQueue[stageTargetIndex],
      })
    }
  }

  return {
    mode,
    plans: plans.slice(0, TOTAL_TARGETS),
  }
}

export function getDistancePlan(
  schedule: DistanceSchedule,
  targetIndex: number,
): TargetDistancePlan {
  const fallbackIndex = Math.min(
    Math.max(targetIndex, 0),
    schedule.plans.length - 1,
  )

  return schedule.plans[fallbackIndex]
}

type CreateStageDistanceValuesParams = {
  stageIndex: number
  startValue: number
  multiplier: number
}

// สร้างชุดค่าระยะสำหรับ stage ใด stage หนึ่ง โดยเพิ่มทีละ step
function createStageDistanceValues({
  stageIndex,
  startValue,
  multiplier,
}: CreateStageDistanceValuesParams) {
  const stageStart =
    startValue + stageIndex * TARGETS_PER_STAGE * DISTANCE_VALUE_STEP

  return Array.from({ length: TARGETS_PER_STAGE }, (_, index) => {
    const value = stageStart + index * DISTANCE_VALUE_STEP

    return Math.round(value * multiplier)
  })
}

/**
 * แบ่งค่าใน stage เป็น 2 กลุ่ม:
 * - lower batch = ค่าครึ่งแรก
 * - upper batch = ค่าครึ่งหลัง
 *
 * จากนั้น shuffle แต่ละกลุ่ม แล้วนำมาสลับกันแบบ:
 * lower, upper, lower, upper, ...
 *
 * ตัวอย่าง:
 * lower = [35, 20, 40, 25, 30]
 * upper = [55, 45, 65, 50, 60]
 *
 * result = [35, 55, 20, 45, 40, 65, 25, 50, 30, 60]
 */
function createInterleavedMiniBatchShuffleBag(values: number[]) {
  const middleIndex = Math.ceil(values.length / 2)

  const lowerBatch = shuffleArray(values.slice(0, middleIndex))
  const upperBatch = shuffleArray(values.slice(middleIndex))

  const result: number[] = []
  const maxLength = Math.max(lowerBatch.length, upperBatch.length)

  for (let index = 0; index < maxLength; index += 1) {
    if (lowerBatch[index] !== undefined) {
      result.push(lowerBatch[index])
    }

    if (upperBatch[index] !== undefined) {
      result.push(upperBatch[index])
    }
  }

  return result
}

// สุ่มตำแหน่งของ array โดยใช้ Fisher-Yates shuffle
function shuffleArray<T>(items: T[]) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    const temp = result[i]

    result[i] = result[randomIndex]
    result[randomIndex] = temp
  }

  return result
}