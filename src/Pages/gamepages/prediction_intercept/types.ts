export type GamePhase =
  | 'idle'
  | 'countdown'
  | 'observe'
  | 'wait'
  | 'clickable'
  | 'feedback'
  | 'finished'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type Point = {
  x: number
  y: number
}

export type DifficultyConfig = {
  label: string
  speed: {
    min: number
    max: number
  }
  observeMs: {
    min: number
    max: number
  }
  waitMs: {
    min: number
    max: number
  }
  clickWindowMs: number
  slopeOptions: number[]
}

export type TrialConfig = {
  index: number

  startAt: number
  waitStartAt: number
  clickableStartAt: number

  observeMs: number
  waitMs: number
  clickWindowMs: number

  x0: number
  y0: number

  endX: number
  endY: number

  vx: number
  vy: number

  speed: number
  direction: 1 | -1

  totalMotionMs: number
}

export type TrialResult = {
  trialIndex: number

  predictionError: number
  positionAccuracy: number
  timingAccuracy: number
  trialScore: number

  reactionTimeMs: number | null

  click: Point | null
  actual: Point

  responseLabel: string
}

export type FeedbackState = {
  until: number
  click: Point | null
  actual: Point | null
  error: number | null
  trialScore: number | null
  reactionTimeMs: number | null
  responseLabel: string
}

export type PredictionSummary = {
  totalScore: number
  meanPredictionError: number
  positionAccuracy: number
  timingAccuracy: number
  meanReactionTimeMs: number
  completedTrials: number
}