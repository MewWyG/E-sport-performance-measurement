// สถานะเกมของ Number Search
export type GameState = 'ready' | 'running' | 'finished'

// ข้อมูลตัวเลขบนกระดานที่ใช้ในการแสดงผลและจัดการการคลิก
export type NumberTileData = {
  id: string
  value: number
  xPercent: number
  yPercent: number
  isCleared: boolean
}

export type LevelConfig = {
  level: number
  numberPoolMax: number
  playCount: number
}

export type NumberSearchTargetEvent = {
  level: number
  levelTargetCount: number
  targetOrder: number

  expectedValue: number
  clickedValue: number
  outcome: 'correct'

  responseTimeMs: number

  clickedNumbersBefore: number[]
  clickedNumbersAfter: number[]
  remainingNumbers: number[]

  xPercent: number
  yPercent: number

  targetStartedAtMs: number
  completedAtMs: number
}

export type NumberSearchInputEvent = {
  eventType: 'wrong_number_click'

  level: number
  targetOrder: number

  expectedValue: number
  clickedValue: number

  /**
   * จำนวนครั้งที่กดผิดสะสมทั้งเกม ณ ตอนที่เกิด event นี้
   */
  wrongClickCount: number

  xPercent: number
  yPercent: number

  gameTimeMs: number
}

export type NumberSearchLevelEvent = {
  level: number
  numberCount: number

  startedAtMs: number
  completedAtMs: number
  durationMs: number

  correctClicks: number
  wrongClicks: number
  averageFindTime: number
}

export type NumberSearchStats = {
  levelReached: number
  completedLevels: number
  correctClicks: number
  wrongClicks: number
  totalNumbersShown: number
  elapsedMs: number
  averageFindTime: number
  score: number

  targetEvents: NumberSearchTargetEvent[]
  inputEvents: NumberSearchInputEvent[]
  levelEvents: NumberSearchLevelEvent[]
}