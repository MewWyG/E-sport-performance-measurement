export type GameState = 'ready' | 'running' | 'finished'

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

export type NumberSearchStats = {
  levelReached: number
  completedLevels: number
  correctClicks: number
  wrongClicks: number
  totalNumbersShown: number
  elapsedMs: number
  averageFindTime: number
  score: number
}