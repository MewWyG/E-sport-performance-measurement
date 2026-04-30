export type GameState = 'ready' | 'running' | 'finished'

export type MovementPattern = 'straight' | 'bounce' | 'random'

export type Bounds = {
  width: number
  height: number
}

export type Difficulty = {
  size: number
  speed: number
  lifetime: number
  decoyCount: number
  pattern: MovementPattern
  label: string
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
  nextTurnAt: number
}

export type MovingTargetStats = {
  hits: number
  misses: number
  wrongClicks: number
  elapsedMs: number
  accuracy: number
  averageResponseTime: number
}