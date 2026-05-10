export type Difficulty = 'easy' | 'normal' | 'hard'

export type TrialState = 'idle' | 'countdown' | 'running' | 'finished'

export type Point = {
  x: number
  y: number
}

export type MovementSegment = {
  start: Point
  end: Point
  distance: number
  speed: number
  durationMs: number
  angle: number
}

export type DistanceRange = {
  min: number
  max: number
}

export type DifficultyConfig = {
  label: string
  targetRadius: number
  safeMargin: number

  distancePlan: DistanceRange[]

  speed: {
    min: number
    max: number
  }

  turnAngleDeg: {
    min: number
    max: number
  }

  candidateCount: number
}

export type ContinuousTrackingMetrics = {
  trackingAccuracy: number
  timeOnTargetPercent: number
  meanError: number
  maxError: number
  totalScore: number
  totalTimeSec: number
}

export type EngineUpdate = {
  state: TrialState
  timeLeft: number
  liveAccuracy: number
  metrics: ContinuousTrackingMetrics | null
}

export type EngineStartOptions = {
  difficulty: Difficulty
  durationSec: number
}

export type EngineCallbacks = {
  onUpdate?: (update: EngineUpdate) => void
  onFinish?: (metrics: ContinuousTrackingMetrics) => void
}