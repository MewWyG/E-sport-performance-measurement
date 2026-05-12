export type GameState = 'ready' | 'running' | 'finished'

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
  speed: number
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
   * ระยะรวมที่เป้าต้องเคลื่อนที่ให้ครบในหนึ่ง movement cycle
   * ถ้าชนขอบก่อนครบระยะ จะเด้งแล้วเดินต่อจนครบ
   */
  movementStepDistance: number

  /**
   * ระยะห่างจากจุดเกิดของเป้าก่อนหน้า ไปยังจุดเกิดของเป้าถัดไป
   */
  spawnDistance: number
}

export type MovingTarget = {
  id: string

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
   * จุดเกิดของเป้า ใช้เป็น reference/debug
   * ไม่ได้ใช้เป็นกรอบวงกลมแล้ว
   */
  anchorX: number
  anchorY: number

  /**
   * ระยะที่เป้าต้องเคลื่อนที่ให้ครบก่อนสุ่มทิศใหม่
   */
  movementStepDistance: number

  /**
   * ระยะที่เหลือใน movement cycle ปัจจุบัน
   */
  remainingMoveDistance: number

  plannedSpawnDistance: number
  actualSpawnDistance: number

  stageIndex: number
  mode: GameMode
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
}