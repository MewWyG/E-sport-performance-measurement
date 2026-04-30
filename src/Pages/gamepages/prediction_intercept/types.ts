export type GamePhase = 'idle' | 'visible' | 'hidden' | 'feedback' | 'finished'

export type SeedMode = 'random' | 'fixed'

export type SpeedMode = 'slow' | 'normal' | 'fast'

export type Point = {
  x: number
  y: number
}

export type TrialConfig = {
  index: number
  startAt: number
  hiddenStartAt: number
  visibleMs: number
  occlusionMs: number

  x0: number
  y0: number

  vx: number
  vy: number

  direction: 1 | -1
}

export type TrialResult = {
  trialIndex: number

  predictionError: number
  timingError: number

  biasX: number
  biasY: number

  alongBias: number
  lateralBias: number

  click: Point | null
  actual: Point
}

export type FeedbackState = {
  until: number
  click: Point | null
  actual: Point | null
  error: number | null
}