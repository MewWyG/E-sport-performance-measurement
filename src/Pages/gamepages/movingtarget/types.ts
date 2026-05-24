// สถานะของเกม Moving Target
export type GameState = 'ready' | 'running' | 'finished'

// โหมดความยากของเกม
export type GameMode = 'easy' | 'normal' | 'hard'

export type MovementPattern = 'controlled'

export type Bounds = {
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

export type Difficulty = {
  size: number

  /**
   * เก็บไว้เป็น fallback / compatibility
   * ความเร็วจริงของแต่ละเป้าจะคำนวณจาก movementStepDistance / moveDurationMs
   */
  speed: number

  /**
   * ระยะเวลาที่เป้าควรใช้ในการเคลื่อนที่ครบ movementStepDistance
   * ยิ่งค่าน้อย เป้ายิ่งเร็ว
   */
  moveDurationMs: number

  /**
   * ใช้เป็น safety timeout เฉย ๆ กันกรณี movement logic มีปัญหา
   */
  lifetime: number

  decoyCount: number
  pattern: MovementPattern
  label: string
  mode: GameMode
}

export type TargetDistancePlan = {
  targetIndex: number
  targetNumber: number
  stageIndex: number
  stageTargetIndex: number

  /**
   * ระยะรวมที่เป้านี้เคลื่อนที่ได้ทั้งหมด
   * เมื่อครบระยะนี้ เป้าจะหายทันที
   */
  movementStepDistance: number

  /**
   * ระยะห่างจากจุดเกิดของเป้าก่อนหน้า ไปยังจุดเกิดของเป้าถัดไป
   */
  spawnDistance: number
}

export type MovingTarget = {
  id: string

  targetIndex: number
  targetNumber: number
  stageTargetIndex: number

  x: number
  y: number

  vx: number
  vy: number

  size: number

  bornAt: number
  lifetime: number

  isCorrect: boolean
  pattern: MovementPattern

  /**
   * จุดเกิดของเป้า ใช้เป็นฐานคำนวณตำแหน่งเกิดของเป้าถัดไป
   */
  spawnX: number
  spawnY: number

  /**
   * ระยะรวมที่เป้านี้ต้องเคลื่อนที่ให้ครบ
   */
  movementStepDistance: number

  /**
   * ระยะที่เหลือก่อนเป้านี้จะหาย
   */
  remainingMoveDistance: number

  /**
   * true เมื่อเป้าเคลื่อนที่ครบ movementStepDistance แล้ว
   */
  hasCompletedMovement: boolean

  plannedSpawnDistance: number
  actualSpawnDistance: number

  stageIndex: number
  mode: GameMode
}

export type MovingTargetOutcome = 'hit' | 'miss'

export type MovingTargetMissReason =
  | 'movement_completed'
  | 'safety_timeout'
  | 'empty_area_click'

export type MovingTargetEvent = {
  targetIndex: number
  targetNumber: number
  stageIndex: number
  stageTargetIndex: number
  mode: GameMode

  outcome: MovingTargetOutcome
  missReason?: MovingTargetMissReason

  responseTimeMs: number | null

  movementStepDistance: number
  remainingMoveDistance: number

  plannedSpawnDistance: number
  actualSpawnDistance: number

  spawnX: number
  spawnY: number
  finalX: number
  finalY: number

  targetSize: number
  targetLifetime: number

  createdAtMs: number
  completedAtMs: number
}

export type MovingTargetInputEvent = {
  eventType: 'wrong_target_click' | 'empty_area_click'
  gameTimeMs: number
  targetNumber: number | null
  targetId?: string
  x?: number
  y?: number
}

export type MovingTargetStats = {
  hits: number
  misses: number
  wrongClicks: number
  spawnedTargetCount: number
  elapsedMs: number
  accuracy: number
  averageResponseTime: number
  mode: GameMode

  targetEvents: MovingTargetEvent[]
  inputEvents: MovingTargetInputEvent[]
}