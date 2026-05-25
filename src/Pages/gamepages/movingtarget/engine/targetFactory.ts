import {
  CORRECT_TARGET_SPEED_MULTIPLIER,
  DECOY_MIN_SIZE,
  DECOY_MOVE_DURATION_MULTIPLIER,
  DECOY_SIZE_RATIO,
  DECOY_SPEED_MULTIPLIER,
  MIN_TARGET_SIZE,
  TARGET_SAFETY_LIFETIME_EXTRA_MS,
  TARGET_SAFETY_LIFETIME_MULTIPLIER,
} from '../config'
import type {
  Bounds,
  Difficulty,
  MovingTarget,
  Point,
  TargetDistancePlan,
} from '../types'
import { createDecoyPoint, createSpawnPoint } from './spawnPlanner'

//ใช้สร้างเป้าทั้งชุด เช่น เป้าจริง + เป้าหลอก
type CreateTargetsParams = {
  difficulty: Difficulty
  bounds: Bounds
  now: number
  spawnIndex: number
  previousPoint: Point | null
  distancePlan: TargetDistancePlan
}

// สร้างชุด targets สำหรับการ spawn แต่ละครั้ง
// โดยจะมีทั้ง target จริงและเป้าหลอกตามโหมด
export function createTargets({
  difficulty,
  bounds,
  now,
  spawnIndex,
  previousPoint,
  distancePlan,
}: CreateTargetsParams): MovingTarget[] {
  const spawnBasePoint = previousPoint ?? getCenterPoint(bounds)

  const correctSpawnResult = createSpawnPoint({
    previousPoint: spawnBasePoint, // จุดฐานไว้คำนวณตำแหน่งเป้าใหม่
    bounds,
    targetSize: difficulty.size,
    plannedDistance: distancePlan.spawnDistance, //ระยะที่ต้องการให้เป้าใหม่เกิดห่างจากเจุดฐาน
  })

  const correctTarget = createTarget({
    id: `correct-${spawnIndex}`, // สร้าง id เช่น correct-0, correct-1, ...
    position: correctSpawnResult.point, // ตำแหน่งที่เป้าเกิด
    isCorrect: true,
    difficulty,
    now,
    distancePlan,
    plannedSpawnDistance: distancePlan.spawnDistance,
    actualSpawnDistance: correctSpawnResult.actualDistance,
  })

  const targets: MovingTarget[] = [correctTarget] //เป็น array เพราะบาง mode มีเป้าหลอกด้วย
// สร้างเป้าหลอกตามจำนวนที่กำหนดใน difficulty
  for (let decoyIndex = 0; decoyIndex < difficulty.decoyCount; decoyIndex += 1) {
    //คำนวณขนาดเป้าหลอก
    const decoySize = Math.max(difficulty.size * DECOY_SIZE_RATIO, DECOY_MIN_SIZE)

    const decoyPoint = createDecoyPoint({
      correctPoint: correctSpawnResult.point,
      bounds,
      targetSize: decoySize,
      decoyIndex,
    })
    
    //สร้างเป้าหลอกแล้วเพิ่มเข้า array targets
    targets.push(
      createTarget({
        id: `decoy-${spawnIndex}-${decoyIndex}`,
        position: decoyPoint,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: decoySize,
          moveDurationMs: 
            difficulty.moveDurationMs * DECOY_MOVE_DURATION_MULTIPLIER, //เป้าหลอกจะช้ากว่าเป้าจริงเล็กน้อย
        },
        now,
        distancePlan,
        plannedSpawnDistance: 0, //เป็น 0 เพราะระบบ spawn distance หลักใช้วัดกับเป้าจริงเท่านั้น
        actualSpawnDistance: 0, //เป้าหลอกอิงจากจุดเกิดของเป้าจริง 
      }),
    )
  }

  return targets
}

//ใช้สร้างเป้า 1 ตัว
type CreateTargetParams = {
  id: string
  position: Point
  isCorrect: boolean
  difficulty: Difficulty
  now: number
  distancePlan: TargetDistancePlan
  plannedSpawnDistance: number
  actualSpawnDistance: number
}

//สร้าง target เดี่ยวๆ ไม่รวมเป้าหลอก
function createTarget({
  id,
  position,
  isCorrect,
  difficulty,
  now,
  distancePlan,
  plannedSpawnDistance,
  actualSpawnDistance,
}: CreateTargetParams): MovingTarget {
  const angle = Math.random() * Math.PI * 2 //สุ่มมุมการเคลื่อนที่ 0-360 องศา

  //คำนวณความเร็วของเป้า baseSpeed = ระยะที่ต้องวิ่ง / เวลาที่ต้องใช้
  const baseSpeed = distancePlan.movementStepDistance / Math.max(difficulty.moveDurationMs, 1)

  const speedMultiplier = isCorrect ? CORRECT_TARGET_SPEED_MULTIPLIER : DECOY_SPEED_MULTIPLIER
  
  //คำนวณความเร็วจริงโดยคูณกับ multiplier ที่กำหนดใน config
  const speed = baseSpeed * speedMultiplier

  //คำนวณว่าเป้านี้จะใช้เวลาประมาณเท่าไหร่ในการเคลื่อนที่ครบระยะ movementDuration = ระยะ / ความเร็ว
  const movementDuration = distancePlan.movementStepDistance / speed
  const safetyLifetime = Math.ceil(movementDuration * TARGET_SAFETY_LIFETIME_MULTIPLIER + TARGET_SAFETY_LIFETIME_EXTRA_MS,
  )

  return {
    id,

    targetIndex: distancePlan.targetIndex,
    targetNumber: distancePlan.targetNumber,
    stageTargetIndex: distancePlan.stageTargetIndex,
    //ตำแหน่งเริ่มต้น
    x: position.x,
    y: position.y,
    //ความเร็วในแกน x และ y คำนวณจากมุมและความเร็วจริง
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,

    size: Math.max(difficulty.size, MIN_TARGET_SIZE),

    bornAt: now,
    lifetime: Math.max(difficulty.lifetime, safetyLifetime),

    isCorrect,
    pattern: difficulty.pattern,

    spawnX: position.x,
    spawnY: position.y,

    movementStepDistance: distancePlan.movementStepDistance,
    remainingMoveDistance: distancePlan.movementStepDistance,
    hasCompletedMovement: false,

    plannedSpawnDistance,
    actualSpawnDistance,

    stageIndex: distancePlan.stageIndex,
    mode: difficulty.mode,
  }
}

// หาจุดกลางของพื้นที่เล่น
function getCenterPoint(bounds: Bounds): Point {
  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
  }
}