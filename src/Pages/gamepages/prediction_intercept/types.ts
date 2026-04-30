export type GamePhase = 'idle' | 'visible' | 'hidden' | 'feedback' | 'finished'

export type MotionMode = 'linear' | 'curve' | 'acceleration'

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

  ax: number
  ay: number

  curveAmplitude: number
  curveFrequency: number
  curvePhase: number

  motionMode: MotionMode
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