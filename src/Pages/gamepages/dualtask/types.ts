export type GameStatus = 'idle' | 'playing' | 'finished'

export type Point = {
  x: number
  y: number
}

export type Target = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  maxSpeed: number
  phaseX: number
  phaseY: number
}

export type KeySequence = {
  id: string
  keys: string[]
  currentIndex: number
  startedAt: number
  expiresAt: number
}

export type DualTaskLiveStats = {
  timeLeftMs: number
  trackingAccuracy: number
  averageDistance: number
  inputAccuracy: number
  completedSequences: number
  wrongInputs: number
  avgInputReactionMs: number
  multitaskScore: number
}

export type DualTaskResult = {
  gameType: 'dual_task'
  sessionSeed: number
  durationMs: number

  trackingAccuracy: number
  averageDistance: number
  stability: number

  inputAccuracy: number
  completedSequences: number
  totalKeyInputs: number
  correctKeyInputs: number
  wrongKeyInputs: number
  avgInputReactionMs: number

  multitaskScore: number
  playedAt: string
}